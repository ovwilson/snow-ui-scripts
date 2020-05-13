
interface SnowBase {
    sys_id: string;
    title?: string;
    name?: string;
    description?: string;
    short_description?: string;
    category?: string;
    environment?: 'development' | 'test' | 'production';
    sys_updated_on: Date;
    sys_created_on: Date;
    sys_updated_by: string;
    sys_created_by: string;
}

interface Prop extends SnowBase {
    resource_table: string;
    ssr_sys_id: string;
    ssr_uri: string;
    ssr_file_uri: string;
    ssr_query: string;
    ssr_limit: number;
}


// export interface ResourceMetaData extends SnowBase {
//     size_bytes?: number;
//     table_name: string;
//     table_sys_id: string;
//     content_type: string;
//     defer: boolean;
//     module: boolean;
// }


interface Resource {
    name: string;
    type: 'js' | 'css';
    defer?: boolean;
    module?: boolean;
    sys_id?: string;
}

interface ResourceMetaData {
    size_bytes: string;
    file_name: string;
    table_name: string;
    sys_id: string;
    table_sys_id: string;
    content_type: string;
}

interface Options {
    tableSysId: string;
    uri: string;
    query: string;
    fileUri: string;
    limit: number;
    resource_table: string;
    resources: Resource[];
}


class Resources {

    private token = () => (window as any).g_ck || '';
    private cs = document.currentScript;
    private uri: string = this.cs.getAttribute('data-uri');
    private scope: string = this.cs.getAttribute('data-scope');
    private category: string = this.cs.getAttribute('data-category');
    private env: string = this.cs.getAttribute('data-env');
    private properties_table = this.cs.getAttribute('data-table-props');
    private resources_table = this.cs.getAttribute('data-table-resources');
    private query = `sysparm_query=scope=${this.scope}^environment=${this.env}^category=${this.category}`;
    private properties_limit = `sysparm_limit=1`;
    private options: Options;

    constructor() {

        this.request(this.getUri('properties', null), this.token())
            .then((xhr: XMLHttpRequest) => { this.onSuccess(xhr); return xhr; })
            .then((xhr: XMLHttpRequest) => this.setOptions(xhr))
            .then(() => this.request(this.getUri('resources', null), this.token()))
            .then((xhr: XMLHttpRequest) => { this.onSuccess(xhr); return xhr; })
            .then((xhr: XMLHttpRequest) => this.setResources(xhr))
            .then(() => this.request(this.getUri('scripted_rest_api', null), this.token()))
            .then((xhr: XMLHttpRequest) => { this.onSuccess(xhr); return xhr; })
            .then((xhr: XMLHttpRequest) => this.setSysIds(xhr))
            .then((transformedFiles: Resource[]) => this.getContent(transformedFiles))
            .catch((xhr: XMLHttpRequest) => this.onError(xhr));
    }

    getUri(name: 'properties' | 'resources' | 'scripted_rest_api' | 'file', file: Resource | null) {
        switch (name) {
            case 'properties': return `${this.uri}/${this.scope}_${this.properties_table}?${this.query}&${this.properties_limit}`; break;
            case 'resources': return `${this.uri}/${this.scope}_${this.resources_table}?${this.query}`; break;
            case 'scripted_rest_api': return `${this.options.uri}?${this.options.query}${this.options.tableSysId}&sysparm_limit=${this.options.limit}`; break;
            case 'file': return `${this.options.uri}/${this.options.fileUri.replace('{{sys_id}}', file.sys_id)}`; break;
            default: return null; break;
        }
    }

    setOptions(xhr: XMLHttpRequest) {
        let data: Prop = JSON.parse(xhr.response).result[0];
        this.options = ({
            tableSysId: data.ssr_sys_id,
            uri: data.ssr_uri,
            fileUri: data.ssr_file_uri,
            query: data.ssr_query,
            limit: data.ssr_limit,
            resource_table: data.resource_table,
            resources: []
        });
    }

    setResources(xhr: XMLHttpRequest) {
        let data: Resource[] = JSON.parse(xhr.response).result;
        this.options = ({ ...this.options, resources: data });
    }

    setSysIds(xhr: XMLHttpRequest): Resource[] {
        let data: ResourceMetaData[] = JSON.parse(xhr.response).result;
        return this.transformFiles(this.options.resources, data);
    }

    getContent(files: Resource[]): void {
        files.map(file => this.request(this.getUri('file', file), this.token())
            .then((xhr: XMLHttpRequest) => { this.onSuccess(xhr); return xhr; })
            .then((xhr: XMLHttpRequest) => this.findContentType(xhr, file))
            .catch((xhr: XMLHttpRequest) => this.onError(xhr))
        )
    }

    findContentType(xhr: XMLHttpRequest, file: Resource) {
        switch (file.type) {
            case 'js': this.setScriptTag(xhr, file); break;
            case 'css': this.setStyleTag(xhr); break;
            default: break;
        }
    }

    setScriptTag(xhr: XMLHttpRequest, file: Resource): void {
        let body, newScript, inlineScript;
        body = document.getElementsByTagName('body')[0];
        newScript = document.createElement("script");
        if (file.defer) { newScript.defer = true; newScript.setAttribute('nomodule', 'true'); }
        if (file.module) { newScript.setAttribute("type", "module"); }
        inlineScript = document.createTextNode(xhr.responseText);
        newScript.appendChild(inlineScript);
        body.appendChild(newScript);
    }

    setStyleTag(xhr: XMLHttpRequest) {
        /* Create style document */
        let css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(document.createTextNode(xhr.responseText));
        /* Append style to the tag name */
        document.getElementsByTagName('head')[0].appendChild(css);
    }

    transformFiles(files: Resource[], data: ResourceMetaData[]): Resource[] { return files.map(file => this.filterByFileName(file, data)); }

    filterByFileName(file: any, data: ResourceMetaData[]) {
        let filteredFile = data.filter(d => d.file_name === file.name)[0];
        return ({ ...file, sys_id: filteredFile.sys_id });
    }

    request(url: string, token: string): Promise<any> {
        let xhr: XMLHttpRequest = new XMLHttpRequest();
        return new Promise(function (resolve, reject) {
            xhr.open('get', url);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-UserToken', token);
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;
                xhr.status === 200 ? resolve(xhr) : reject(xhr);
            }
            xhr.send();
        });
    }

    onSuccess(xhr: XMLHttpRequest): void { console.info(`${xhr.status} - ${xhr.statusText}`); }

    onError(xhr: XMLHttpRequest): void { console.error(`Error: ${xhr.status} - ${xhr.statusText}`, JSON.parse(xhr.responseText)); }
}

new Resources();