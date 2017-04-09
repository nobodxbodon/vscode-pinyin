/// <reference types="node" />

declare module "recursive-fs" {
    export function readdirr(path: string, callback: (err: NodeJS.ErrnoException, dirs: string[], files: string[]) => void);
    export function rmdirr(path: string, callback: (err?: NodeJS.ErrnoException) => void);
    export function cpdirr(spath: string, tpath: string, callback: (err?: NodeJS.ErrnoException) => void);
}

