'use strict';
/*!
 * s1panel - sensor/file_status
 * Reads a JSON status file and reports its content.
 * File format: { "status": "idle", "message": "...", "ts": 1234567890 }
 */
const fs = require('fs');
const logger = require('../logger');

const STATUS_FILE = process.env.AGENT_STATUS_FILE || '/tmp/agent_status.json';

function read_status() {
    try {
        const raw = fs.readFileSync(STATUS_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return { status: 'idle', message: '' };
    }
}

function sample(rate, format, config) {
    return new Promise((fulfill) => {
        const s = read_status();
        const _output = format.replace(/{(\d+)}/g, function (match, number) {
            switch (number) {
                case '0': return s.status || 'idle';
                case '1': return s.message || '';
                case '2': return s.ts || '';
                default: return 'null';
            }
        });
        fulfill({ value: _output, min: 0, max: 1 });
    });
}

function init(config) {
    logger.info('initialize: file_status sensor watching ' + STATUS_FILE);
    return 'file_status';
}

function stop() { return Promise.resolve(); }

function settings() {
    return {
        name: 'file_status',
        description: 'displays agent task status from a JSON file',
        icon: 'pi-file',
        multiple: false,
        fields: []
    };
}

module.exports = { init, settings, sample, stop };
