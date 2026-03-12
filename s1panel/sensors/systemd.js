'use strict';
/*!
 * s1panel - sensor/systemd
 */
const { exec } = require('child_process');
const logger = require('../logger');

function get_service_status(serviceName) {
    return new Promise((resolve) => {
        exec(`systemctl is-active ${serviceName}`, (err, stdout, stderr) => {
            if (stdout.trim() === 'active') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

function sample(rate, format, config) {
    return new Promise((fulfill, reject) => {
        const _service = config._private.service;
        get_service_status(_service).then(isActive => {
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
        service: config.service || 'openclaw'
    };
    config._private = _private;
    
    logger.info('initialize: systemd sensor set to ' + _private.service);
    return 'systemd_' + _private.service;
}

function stop() {
    return Promise.resolve();
}

function settings() {
    return {
        name: 'systemd',
        description: 'monitor systemd service status',
        icon: 'pi-cog',
        multiple: true,
        ident: [ 'service' ],
        fields: [
            { name: 'service', type: 'string', value: 'openclaw' }
        ]
    };
}

module.exports = {
    init,
    settings,
    sample,
    stop
};
