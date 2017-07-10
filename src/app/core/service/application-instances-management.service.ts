/**
 * Copyright (c) 2017 University of Stuttgart.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * and the Apache License 2.0 which both accompany this distribution,
 * and are available at http://www.eclipse.org/legal/epl-v10.html
 * and http://www.apache.org/licenses/LICENSE-2.0
 *
 * Contributors:
 *     Michael Falkenthal - initial implementation
 *     Michael Wurster - initial implementation
 */
import { Injectable } from '@angular/core';
import { OpenToscaLoggerService } from './open-tosca-logger.service';
import { ApplicationManagementService } from './application-management.service';
import { Observable } from 'rxjs/Observable';
import { ApplicationInstance } from '../model/application-instance.model';
import { Csar } from '../model/new-api/csar.model';
import { ServiceTemplateInstanceListEntry } from '../model/new-api/service-template-instance-list-entry.model';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { ServiceTemplateList } from '../model/new-api/service-template-list.model';
import { ServiceTemplate } from '../model/new-api/service-template.model';
import { ServiceTemplateInstanceList } from '../model/new-api/service-template-instance-list.model';
import { ServiceTemplateInstance } from '../model/new-api/service-template-instance.model';

@Injectable()
export class ApplicationInstancesManagementService {

    constructor(private logger: OpenToscaLoggerService,
                private appService: ApplicationManagementService,
                private http: Http) {
    }

    getServiceTemplateInstancesOfCsar(app: Csar): Observable<Array<ServiceTemplateInstance>> {
        const reqOpts = new RequestOptions({headers: new Headers({'Accept': 'application/json'})});
        return this.http.get(app._links['servicetemplates'].href)
            .map((response: Response) => response.json())
            .flatMap((response: ServiceTemplateList) => {
                return this.http.get(response.service_templates[0]._links['self'].href, reqOpts)
                    .map((rawServiceTemplate: Response) => rawServiceTemplate.json())
                    .flatMap((serviceTemplate: ServiceTemplate) => {
                        return this.http.get(serviceTemplate._links['instances'].href, reqOpts)
                            .map((rawInstanceList: Response) => rawInstanceList.json())
                            .flatMap((instanceList: ServiceTemplateInstanceList) => {
                                const obs: Array<Observable<Response>> = [];
                                for (const entry of instanceList.service_template_instances) {
                                    obs.push(this.http.get(entry._links['self'].href, reqOpts));
                                }
                                return Observable.forkJoin(obs)
                                    .flatMap((rawFullInstances: Array<Response>) => {
                                        const resultAry: Array<ServiceTemplateInstance> = [];
                                        for (const r of rawFullInstances) {
                                            resultAry.push(r.json());
                                        }
                                        return Observable.of(resultAry);
                                    });
                            })
                            .catch(reason => this.logger.handleError(
                                '[application-instances.service][getServiceTemplateInstances][fetching instances]',
                                reason));
                    })
                    .catch(reason => this.logger.handleError(
                        '[application-instances.service][getServiceTemplateInstances][fetching service template]',
                        reason));
            })
            .catch(reason => this.logger.handleError(
                '[application-instances.service][getServiceTemplateInstances][fetching service template list]',
                reason));
    }

    /**
     * Loads instances of the current app
     */
    loadInstancesList(appID: string): Observable<Array<ApplicationInstance>> {
        return this.appService.getServiceTemplateInstancesByAppID(appID)
            .flatMap(instancesReferences => {
                return this.appService.getPropertiesOfServiceTemplateInstances(instancesReferences)
                    .map(instancesPropertiesList => {
                        const preparedResults: Array<ApplicationInstance> = [];
                        for (const instanceProperties of instancesPropertiesList) {
                            const appInstance = new ApplicationInstance(appID, instanceProperties.instanceReference, instanceProperties);
                            preparedResults.push(appInstance);
                        }
                        return preparedResults;
                    })
                    .catch(reason => this.logger.handleError(
                        '[application-instances.service][loadInstancesList][getProvisioningStateofServiceTemplateInstance]',
                        reason));
            })
            .catch(reason => this.logger.handleError(
                '[application-instances.service][loadInstancesList][getServiceTemplateInstancesByAppID]', reason
            ));
    }

}
