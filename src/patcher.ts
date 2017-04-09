import * as fs from 'mz/fs';
import { gunzip } from 'mz/zlib';
import { cpdirr } from './async-recursive-fs';
import * as path from 'path';
import { workbenchMainJs, workbenchDir, nodeModulesDir } from './vscodePath';
import { version, window, commands, workspace, WorkspaceConfiguration, Disposable } from 'vscode';
import { logger } from './util';

const patchDir = path.join(__dirname, '..', '..', 'patch');
const backupFile = path.join(workbenchDir, `workbench.main.js.pinyin.${version}.bak`);
/**
 * 打代码补丁类
 * 
 * @class Patcher
 */
export class Patcher {
    lastConfig?: WorkspaceConfiguration;
    subscriptions: Disposable[] = [];
    constructor() {
        this.init();
    }

    async init() {
        var isFirstLoad = await this.checkFirstLoad();

        if (isFirstLoad) {
            try {
                await this.install();
            } catch (err) {
                if (err instanceof PatchError) {
                    window.showWarningMessage(err.message);
                } else {
                    window.showErrorMessage(err.message);
                }
            }
        }

        this.lastConfig = workspace.getConfiguration('pinyin');

        this.subscriptions.push(
            workspace.onDidChangeConfiguration(
                this.updateConfig,
                this,
                this.subscriptions));
    }

    async install() {
        // 检查匹配当前版本VSCode的补丁是否存在并读取
        let patch: Buffer = null;
        try {
            patch = await fs.readFile(path.join(patchDir, `${version}.gz`));
        } catch (err) {
            throw new PatchError("不存在适合当前版本VSCode的补丁");
        }

        if (await fs.exists(backupFile)) {
            throw new PatchError("已经打过补丁，请勿重复打补丁");
        }

        // 解压补丁
        patch = await gunzip(patch);

        try {
            // 备份先前的workbench.js文件
            var data = await fs.readFile(workbenchMainJs);
            await fs.writeFile(backupFile, data);
            // 复制pinyinlite模块到vscode目录下
            await cpdirr(
                path.join(__dirname, '..', '..', 'node_modules', 'pinyinlite'),
                path.join(nodeModulesDir, 'pinyinlite'));

            await fs.writeFile(workbenchMainJs, patch);
        } catch (err) {
            throw new PatchError("安装失败，请以管理员身份运行VSCode再打补丁");
        }
    }

    /**
     * 是否刚刚安装插件
     * 
     * @returns boolean
     * 
     * @memberOf Background
     */
    async checkFirstLoad() {
        console.log('Pinyin: checkFirstLoad');
        const configPath = path.join(__dirname, '..', '..', 'config.json');
        var info = JSON.parse(await fs.readFile(configPath, 'utf8'));
        if (info.firstload) {
            // var hasOld = this.removeOld();
            // var content = hasOld ? 'Ver. old uninstalled. ' : '';

            window.showInformationMessage('欢迎安装拼音插件，你可以在settings.json中配置插件.');
            info.firstload = false;
            await fs.writeFile(configPath, JSON.stringify(info, null, '    '), 'utf8');

            return true;
        }

        return false;
    }

    async uninstall() {
        if (!await fs.exists(backupFile)) {
            throw new PatchError('并没有打过补丁');
        }
        try {
            var data = await fs.readFile(backupFile);
            await fs.writeFile(workbenchMainJs, data);
            await fs.unlink(backupFile);
        } catch (err) {
            throw new PatchError('卸载失败，请以管理员身份运行VSCode再进行卸载');
        }

        
    }

    async updateConfig() {
        var lastConfig = this.lastConfig;
        var config = workspace.getConfiguration('pinyin');

        try {
            //卸载补丁
            if (!config['enabled'] && lastConfig['enabled']) {
                await this.uninstall();
                this.showInfoAndRestart('安装完成,开始重启VSCode');
            }

            //打补丁
            if (config['enabled'] && !lastConfig['enabled']) {
                await this.install();
                this.showInfoAndRestart('卸载完成,开始重启VSCode');
            }
        } catch (err) {
            if (err instanceof PatchError) {
                window.showWarningMessage(err.message);
            } else {
                window.showErrorMessage(err.message);
            }
        }
        this.lastConfig = config;
    }

    showInfoAndRestart(content: string) {
        window.showInformationMessage(content, { title: "重启 vscode" })
            .then(function (item) {
                if (!item) return;
                commands.executeCommand('workbench.action.reloadWindow');
            });
    }

    dispose() {
        this.subscriptions.forEach(v => v.dispose());
    }
}

export class PatchError extends Error {
}