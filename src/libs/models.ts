export interface FileSchema {
    name: string;
    defer: boolean;
    module: boolean;
    sys_id?: string;
}

export interface FileMetaData {
    size_bytes: string;
    file_name: string;
    table_name: string;
    sys_id: string;
    table_sys_id: string;
    content_type: string;
}

export interface SNOWOptions {
    tableSysId: string;
    uri:string;
    query: string;
    fileUri: string;
    limit: string;
    files: FileSchema[];
}