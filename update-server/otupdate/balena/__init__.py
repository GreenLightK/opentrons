import os
import json
import logging

from aiohttp import web
from functools import partial
from . import control, install
from . import endpoints as bootstrap_endp

import otupdate.migration

log = logging.getLogger(__name__)


def get_version(path) -> str:
    """
    Reads the version field from a package file

    :param path: the path to a valid package.json file
    :return: the version string or "unknown"
    """
    if path and os.path.exists(path):
        with open(path) as pkg:
            package_dict = json.load(pkg)
            version = package_dict.get('version')
    else:
        version = 'not available'
    return version


# this naming logic is copied from compute/scripts/anounce_mdns.py
def get_name() -> str:
    device_name = 'opentrons-{}'.format(
        os.environ.get('RESIN_DEVICE_NAME_AT_INIT', 'dev'))
    return device_name


def get_app(
        api_package,
        update_package,
        smoothie_version,
        test,
        with_migration=False,
        loop=None) -> web.Application:
    # Health endpoint built here in order to keep from having state initialized
    # on import of sub-modules
    api_server_version = get_version(api_package)
    update_server_version = get_version(update_package)
    device_name = get_name()
    system_version = os.environ.get('OT_SYSTEM_VERSION', 'unknown')
    log.info("  Device name:            {}".format(device_name))
    log.info("  Update server version:  {}".format(update_server_version))
    log.info("  API server version:     {}".format(api_server_version))
    log.info("  Smoothie FW version:    {}".format(smoothie_version))
    log.info("  System Version:         {}".format(system_version))
    log.info("  Test mode:              {}".format(test))

    health = bootstrap_endp.build_health_endpoint(
        name=device_name,
        update_server_version=update_server_version,
        api_server_version=api_server_version,
        smoothie_version=smoothie_version,
        system_version=system_version,
        with_migration=with_migration,
    )
    bootstrap_fn = partial(
        bootstrap_endp.bootstrap_update_server, test_flag=test)

    app = web.Application()
    app.router.add_routes([
        web.get('/server/update/health', health),
        web.post('/server/update', install.update_api),
        web.post('/server/update/bootstrap', bootstrap_fn),
        web.post('/server/restart', control.restart)
    ])
    if with_migration:
        app = otupdate.migration.add_endpoints(app, device_name)
    return app
