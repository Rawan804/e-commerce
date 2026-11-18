<?php

return [

    'default' => env('BROADCAST_CONNECTION', 'null'),

    'connections' => [

        'reverb' => [
            'driver' => 'reverb',
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'app_id' => env('REVERB_APP_ID'),
            'options' => [
                // عنوان Reverb كما يراه الـ Laravel (داخل شبكة docker: اسم الحاوية reverb)
                'host' => env('REVERB_HOST', 'reverb'),
                'port' => env('REVERB_PORT', 8080),
                'scheme' => env('REVERB_SCHEME', 'http'),
                'useTLS' => env('REVERB_SCHEME', 'http') === 'https',
            ],
            // مهلة قصيرة: إذا Reverb واقع ما نعلّق طلب الزبون
            'client_options' => ['timeout' => 2, 'connect_timeout' => 1],
        ],

        'log' => ['driver' => 'log'],

        'null' => ['driver' => 'null'],

    ],

];
