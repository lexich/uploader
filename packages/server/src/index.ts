import { initApp } from './app';
import * as fs from 'fs';
import { IAssetManifest } from './interfaces';
import winston from 'winston';
import fetch from 'node-fetch';
import path from 'path'
import ARGS from './args';

function getManifest(): Promise<IAssetManifest> {
    if (process.env.NODE_ENV === 'production') {
        return new Promise((resolve) => {
            const data = fs.readFileSync(
                path.join(ARGS.static, 'asset-manifest.json')
            ).toString();
            resolve(JSON.parse(data));
        });

    } else {
        const root = 'http://localhost:3000';
        return fetch(`${root}/asset-manifest.json`).then(r => r.json()).then((d:IAssetManifest) => {
            const entrypoints = d.entrypoints.map(asset => `${root}/${asset}`)
            return { ...d, entrypoints };
        });
    }
}

getManifest().catch((err: Error) => {
    winston.log('error', err.message, err);
    const manifest: IAssetManifest = {
        files: {},
        entrypoints: ['/static/index.js', '/static/index.css']
    };
    return manifest;
}).then(manifest => initApp(manifest));
