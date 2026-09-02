<?php

// ============================================================
// FPO Learning Tools SSO Integration
// ============================================================

define('NAFPO_FPO_LEARNING_TOOLS_SSO_SECRET', 'nafpo-sso-K9x2mPvQ7wLdR4nJ8yFcBhT6eA3sG5uZlaskjdf');

define(
    'NAFPO_FPO_LEARNING_TOOLS_URL',
    'https://nafpolearningtoolslandingpage.vercel.app'
);

// ============================================================
// JWT HELPERS
// ============================================================

function nafpo_fpo_learning_tools_base64url_encode($data) {
    return rtrim(
        strtr(base64_encode($data), '+/', '-_'),
        '='
    );
}

function nafpo_fpo_learning_tools_generate_sso_token($user) {
    $issued_at = time();

    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT',
    ];

    $phone = get_user_meta($user->ID, 'phone', true);

    if (!$phone) {
        $phone = get_user_meta($user->ID, 'billing_phone', true);
    }

    $fpo_name = get_user_meta($user->ID, 'fpo_name', true);

    if (!$fpo_name) {
        $fpo_name = get_user_meta($user->ID, 'company', true);
    }

    if (!$fpo_name) {
        $fpo_name = get_user_meta(
            $user->ID,
            'billing_company',
            true
        );
    }

    $state = get_user_meta($user->ID, 'state', true);

    if (!$state) {
        $state = get_user_meta(
            $user->ID,
            'billing_state',
            true
        );
    }

    $district = get_user_meta($user->ID, 'district', true);

    if (!$district) {
        $district = get_user_meta(
            $user->ID,
            'billing_city',
            true
        );
    }

    $payload_data = [
        'wp_user_id' => (int) $user->ID,
        'email' => $user->user_email,
        'name' => $user->display_name,
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,

        'phone' => $phone ?: null,
        'fpo_name' => $fpo_name ?: null,

        'registration_no' => get_user_meta(
            $user->ID,
            'registration_no',
            true
        ) ?: null,

        'state' => $state ?: null,
        'district' => $district ?: null,

        'main_commodity' => get_user_meta(
            $user->ID,
            'main_commodity',
            true
        ) ?: null,

        'avatar_url' => get_avatar_url(
            $user->ID,
            ['size' => 96]
        ) ?: null,

        'wp_role' => implode(',', $user->roles),

        'iat' => $issued_at,
        'exp' => $issued_at + 300,
    ];

    $payload_data = array_filter(
        $payload_data,
        function ($value) {
            return $value !== null;
        }
    );

    $header_json = wp_json_encode($header);
    $payload_json = wp_json_encode($payload_data);

    if (!$header_json || !$payload_json) {
        return new WP_Error(
            'nafpo_fpo_learning_tools_json_error',
            'Unable to create the SSO token.'
        );
    }

    $base64_header = nafpo_fpo_learning_tools_base64url_encode($header_json);
    $base64_payload = nafpo_fpo_learning_tools_base64url_encode($payload_json);

    $signature = hash_hmac(
        'sha256',
        $base64_header . '.' . $base64_payload,
        NAFPO_FPO_LEARNING_TOOLS_SSO_SECRET,
        true
    );

    return $base64_header
        . '.'
        . $base64_payload
        . '.'
        . nafpo_fpo_learning_tools_base64url_encode($signature);
}

// ============================================================
// REDIRECT VALIDATION
// ============================================================

function nafpo_fpo_learning_tools_validate_redirect_path($redirect) {
    $redirect = sanitize_text_field(
        wp_unslash((string) $redirect)
    );

    if (
        empty($redirect) ||
        substr($redirect, 0, 1) !== '/' ||
        substr($redirect, 0, 2) === '//'
    ) {
        return '/';
    }

    return $redirect;
}

// ============================================================
// SSO HANDLER
// ============================================================

function nafpo_handle_fpo_learning_tools_sso() {
    $redirect = nafpo_fpo_learning_tools_validate_redirect_path(
        isset($_GET['redirect'])
            ? $_GET['redirect']
            : '/'
    );

    if (!is_user_logged_in()) {
        $return_url = add_query_arg(
            [
                'action' => 'nafpo_fpo_learning_tools_sso',
                'redirect' => $redirect,
            ],
            admin_url('admin-post.php')
        );

        wp_safe_redirect(
            wp_login_url($return_url)
        );

        exit;
    }

    $user = wp_get_current_user();
    $token = nafpo_fpo_learning_tools_generate_sso_token($user);

    if (is_wp_error($token)) {
        wp_die(
            esc_html($token->get_error_message()),
            'SSO Error',
            ['response' => 500]
        );
    }

    $sso_endpoint = rtrim(
        NAFPO_FPO_LEARNING_TOOLS_URL,
        '/'
    ) . '/api/auth/sso';

    $sso_url = add_query_arg(
        [
            'token' => $token,
            'redirect' => $redirect,
        ],
        $sso_endpoint
    );

    wp_redirect($sso_url, 302, 'NAFPO SSO');
    exit;
}

add_action(
    'admin_post_nafpo_fpo_learning_tools_sso',
    'nafpo_handle_fpo_learning_tools_sso'
);

add_action(
    'admin_post_nopriv_nafpo_fpo_learning_tools_sso',
    'nafpo_handle_fpo_learning_tools_sso'
);

// ============================================================
// SHORTCODE
// [nafpo_fpo_learning_tools_button]
// [nafpo_fpo_learning_tools_button text="Open Learning Tools"]
// ============================================================

function nafpo_fpo_learning_tools_button_shortcode($atts) {
    $atts = shortcode_atts(
        [
            'text' => 'FPO Learning Tools',
            'class' => '',
            'redirect' => '/',
        ],
        $atts,
        'nafpo_fpo_learning_tools_button'
    );

    $redirect = nafpo_fpo_learning_tools_validate_redirect_path(
        $atts['redirect']
    );

    $url = add_query_arg(
        [
            'action' => 'nafpo_fpo_learning_tools_sso',
            'redirect' => $redirect,
        ],
        admin_url('admin-post.php')
    );

    $classes = ['nafpo-fpo-learning-tools-btn'];

    if (!empty($atts['class'])) {
        $classes[] = sanitize_html_class(
            $atts['class']
        );
    }

    return sprintf(
        '<a href="%s" class="%s">%s</a>',
        esc_url($url),
        esc_attr(implode(' ', $classes)),
        esc_html($atts['text'])
    );
}

add_shortcode(
    'nafpo_fpo_learning_tools_button',
    'nafpo_fpo_learning_tools_button_shortcode'
);

// ============================================================
// BUTTON STYLES
// ============================================================

function nafpo_fpo_learning_tools_button_styles() {
    ?>
    <style>
        .nafpo-fpo-learning-tools-btn {
            display: inline-block;
            padding: 12px 28px;
            border-radius: 8px;
            background-color: #288A49;
            color: #ffffff !important;
            font-size: 16px;
            font-weight: 600;
            line-height: 1.4;
            text-decoration: none !important;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .nafpo-fpo-learning-tools-btn:hover,
        .nafpo-fpo-learning-tools-btn:focus {
            background-color: #1f6e3a;
            color: #ffffff !important;
        }
    </style>
    <?php
}

add_action(
    'wp_head',
    'nafpo_fpo_learning_tools_button_styles'
);
