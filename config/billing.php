<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Subscription Plans
    |--------------------------------------------------------------------------
    |
    | Define your subscription plans here. Each plan should have a unique key,
    | a display name, price information, and feature limits.
    |
    | Note: The 'stripe_price_id' values should be replaced with your actual
    | Stripe Price IDs from your Stripe Dashboard.
    |
    */

    'plans' => [
        'free' => [
            'name' => 'Free',
            'description' => 'Perfect for getting started',
            'price' => [
                'monthly' => 0,
                'yearly' => 0,
            ],
            'stripe_price_id' => [
                'monthly' => null, // No Stripe price for free plan
                'yearly' => null,
            ],
            'limits' => [
                'workspaces' => 1,
                'team_members' => 2,
                'api_keys' => 2,
                'webhooks' => 1,
                'work_orders' => 15, // 15 jobs per month
                'storage_mb' => 50, // 50 MB
                'automations' => 0, // Not allowed on free plan
                'custom_templates' => 3,
            ],
            'features' => [
                '1 Workspace',
                '2 Team Members',
                '15 Work Orders / month',
                '50MB Evidence Storage',
                'Standard Checklists',
            ],
        ],

        'pro' => [
            'name' => 'Pro',
            'description' => 'For growing teams',
            'price' => [
                'monthly' => 29,
                'yearly' => 290, // ~2 months free
            ],
            'stripe_price_id' => [
                'monthly' => env('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_pro_monthly'),
                'yearly' => env('STRIPE_PRO_YEARLY_PRICE_ID', 'price_pro_yearly'),
            ],
            'limits' => [
                'workspaces' => 5,
                'team_members' => 10,
                'api_keys' => 10,
                'webhooks' => 5,
                'work_orders' => 100, // 100 jobs per month
                'storage_mb' => 1024, // 1 GB
                'automations' => 10,
                'custom_templates' => 25,
            ],
            'features' => [
                '5 Workspaces',
                '10 Team Members',
                '100 Work Orders / month',
                '1GB Evidence Storage',
                '10 Automation Rules',
                'Email Notifications',
            ],
            'popular' => true,
        ],

        'business' => [
            'name' => 'Business',
            'description' => 'For larger organizations',
            'price' => [
                'monthly' => 79,
                'yearly' => 790, // ~2 months free
            ],
            'stripe_price_id' => [
                'monthly' => env('STRIPE_BUSINESS_MONTHLY_PRICE_ID', 'price_business_monthly'),
                'yearly' => env('STRIPE_BUSINESS_YEARLY_PRICE_ID', 'price_business_yearly'),
            ],
            'limits' => [
                'workspaces' => -1, // Unlimited
                'team_members' => -1, // Unlimited
                'api_keys' => -1, // Unlimited
                'webhooks' => -1, // Unlimited
                'work_orders' => -1, // Unlimited
                'storage_mb' => 25600, // 25 GB
                'automations' => -1, // Unlimited
                'custom_templates' => -1, // Unlimited
            ],
            'features' => [
                'Unlimited Workspaces',
                'Unlimited Team Members',
                'Unlimited Work Orders',
                '25GB Evidence Storage',
                'Unlimited Automations',
                'Priority Support',
                'All Features',
                'Dedicated Support',
                'Advanced Analytics',
                'Custom Integrations',
                'SSO (Coming Soon)',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Trial Period
    |--------------------------------------------------------------------------
    |
    | The number of days to offer as a trial period for new subscriptions.
    | Set to 0 to disable trials.
    |
    */

    'trial_days' => 14,

    /*
    |--------------------------------------------------------------------------
    | Stripe Webhook Secret
    |--------------------------------------------------------------------------
    |
    | The webhook secret is used to verify that incoming webhooks are
    | actually from Stripe. Get this from your Stripe Dashboard.
    |
    */

    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),

];
