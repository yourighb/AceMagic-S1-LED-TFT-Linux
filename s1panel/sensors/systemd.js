'use strict';
/*!
 * s1panel - sensor/systemd
 */
const { exec } = require('child_process');
const os = require('os');
const logger = require('../logger');

function get_service_status(serviceName, userService) {
    return new Promise((resolve) => {
        let cmd, execOpts = {};
        if (userService) {
            // Must set XDG_RUNTIME_DIR + DBUS address so systemctl --user
            // works even when called from a system service context (no D-Bus session).
            const uid = os.userInfo().uid;
            const xdgDir = `/run/user/${uid}`;
            execOpts.env = {
                ...process.env,
                XDG_RUNTIME_DIR: xdgDir,
                DBUS_SESSION_BUS_ADDRESS: `unix:path=${xdgDir}/bus`
            };
            cmd = `systemctl --user is-active ${serviceName}`;
        } else {
            cmd = `systemctl is-active ${serviceName}`;
        }
        exec(cmd, execOpts, (err, stdout) => {
            resolve(stdout.trim() === 'active');
        });
    });
}

function sample(rate, format, config) {
    return new Promise((fulfill) => {
        const _service = config._private.service;
        const _user = config._private.user_service;
        get_service_status(_service, _user).then(isActive => {
            const statusStr = isActive ? 'active' : 'inactive';
            const _output = format.replace(/{(\d+)}/g, (m, n) => {
                switch (n) {
                    case '0': return _service;
                    case '1': return statusStr;
                    default: return 'null';
                }
            });
            fulfill({ value: _output, min: 0, max: 1 });
        });
    });
}

function init(config) {
    if (!config) { config = {}; }
    config._private = {
        service: config.service || 'openclaw-gateway',
        user_service: config.user_service || false
    };
    const prefix = config._private.user_service ? 'user:' : '';
    logger.info('initialize: systemd sensor set to ' + prefix + config._private.service);
    return 'systemd_' + config._private.service;
}

function stop() { return Promise.resolve(); }

function settings() {
    return {
        name: 'systemd',
        description: 'monitor systemd service status',
        icon: 'pi-cog',
        multiple: true,
        ident: ['service'],
        fields: [
            { name: 'service', type: 'string', value: 'openclaw-gateway' },
            { name: 'user_service', type: 'bool', value: false }
        ]
    };
}

module.exports = { init, settings, sample, stop };
