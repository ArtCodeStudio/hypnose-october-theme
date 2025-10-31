<?php
    function base_path($file) {
        return dirname(__FILE__) . '/../../../../' . $file;
    }

    $database = include '../../../../config/database.php';
    $app = include '../../../../config/app.php';
    $cms = include '../../../../config/cms.php';

    $config = [
        'database' => $database,
        'app' => $app,
        'cms' => $cms,
    ];

    $configJsonStr = json_encode($config);
    echo $configJsonStr;
?>