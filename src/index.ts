import { SNOWOptions } from './libs/models';
import { SNOW } from './libs/snow';

const options: SNOWOptions = {
    tableSysId:'a01b1d83dba30010629a5385ca961957',
    uri: '/api/now/attachment',
    query: 'sysparm_query=table_sys_idSTARTSWITH',
    fileUri: '{{sys_id}}/file',
    limit: 'sysparm_limit=10',
    files: [
        { name: 'runtime-es5.js%20', defer: true, module: false },
        { name: 'runtime-es2015.js%20', defer: false, module: true },
        { name: 'polyfills-es5.js%20', defer: true, module: false },
        { name: 'polyfills-es2015.js%20', defer: false, module: true },
        { name: 'main-es5.js%20', defer: true, module: false },
        { name: 'main-es2015.js%20', defer: false, module: true }
    ]
}

new SNOW(options);