'use strict';
/*!
 * s1panel - sensor/systemd
 */
const { exec } = require('child_process');
const logger = require('../logger');

function get_service_status(serviceName, userService) {
    return new Promise((resolve) => {
        const userFlag = userService ? '--user ' : '';
        exec(`systemctl ${userFlag}is-active ${serviceName}`, (err, stdout, stderr) => {
            resolve(stdout.trim() === 'active');
        });
    });
}

function sample(rate, format, config) {
    return new Promise((fulfill, reject) => {
        const _service = config._private.service;
        const _user = config._private.user_service;
        get_service_status(_service, _user).then(isActive => {
            const statusStr = isActive ? 'active' : 'inactive';
            const _output = format.replace(/{(\d+)}/g, function (match, number) {
                switch (number) {
                    case '0': return _service;
                    case '1': return statusStr;
                    default: return 'null';
                }
            });
            fulfill({ value: _output, min: 0, max: 1 });
        }).catch(err => {
            fulfill({ value: 'error', min: 0, max: 1 });
        });
    });
}

function init(config) {
    if (!config) { config = {}; }
    const _private = {
        service: config.service || 'openclaw',
        user_service: config.user_service || false
    };
    config._private = _private;
    const prefix = _private.user_service ? 'user:' : '';
    logger.info('initialize: systemd sensor set to ' + prefix + _private.service);
    return 'systemd_' + _private.service;
}

function stop() { return Promise.resolve(); }

function settings() {
    return {
        name: 'systemd',
        description: 'monitor systemd service status',
        icon: 'pi-cog',
        multiple: true,
        ident: [ 'service' ],
        fields: [
            { name: 'service', type: 'string', value: 'openclaw-gateway' },
            { name: 'user_service', type: 'bool', value: false }
        ]
    };
}

module.exports = { init, settings, sample, stop };
