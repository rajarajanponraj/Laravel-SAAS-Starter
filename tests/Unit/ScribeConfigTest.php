<?php

use Tests\TestCase;

uses(TestCase::class);

test('scribe config file returns an array safely and does not crash when evaluated', function () {
    $configPath = dirname(__DIR__, 2).'/config/scribe.php';
    $config = require $configPath;

    expect($config)->toBeArray();
});
