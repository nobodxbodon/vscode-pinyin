import * as rfs from 'recursive-fs';

export async function cpdirr(spath: string, tpath: string) {
    return new Promise<void>((resolve, reject) => {
        rfs.cpdirr(spath, tpath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    })
}