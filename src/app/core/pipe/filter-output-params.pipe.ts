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
 */

import { Pipe, PipeTransform } from '@angular/core';
import { PlanParameter } from '../model/plan-parameter.model';
import * as _ from 'lodash';

@Pipe({name: 'filterOutputParams'})
export class FilterOutputParams implements PipeTransform {

    transform(params: Array<PlanParameter>, blacklist: Array<string>): any {
        return params.filter((param) => !_.includes(blacklist, param.name));
    }
}
