#!/usr/bin/env python3
import json
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

control_path = Path(sys.argv[1] if len(sys.argv) > 1 else 'premium-control.json')
cfg = json.loads(control_path.read_text())
config = cfg.setdefault('config', {})
telegram_state = cfg.setdefault('telegram', {})
token = str(config.get('telegramBotToken') or '').strip()
if not token:
    print('AstroSathi Telegram bot token is not configured in premium-control.json; nothing to process.')
    raise SystemExit(0)

base = f'https://api.telegram.org/bot{token}/'

def call(method, data=None):
    payload = json.dumps(data or {}).encode('utf-8')
    req = urllib.request.Request(base + method, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=25) as response:
        body = json.loads(response.read().decode('utf-8'))
    if not body.get('ok'):
        raise RuntimeError(body.get('description') or f'Telegram {method} failed')
    return body.get('result')

def answer(callback_id, text):
    try:
        call('answerCallbackQuery', {'callback_query_id': callback_id, 'text': text, 'show_alert': False})
    except Exception as exc:
        print('answerCallbackQuery warning:', exc)

def parse_fields(text):
    out = {}
    for raw in (text or '').splitlines():
        if ': ' in raw:
            key, value = raw.split(': ', 1)
            out[key.strip()] = value.strip()
    return out

def iso(dt):
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')

def safe_duration():
    try:
        minutes = int(config.get('durationMinutes', 360))
    except Exception:
        minutes = 360
    return max(1, minutes)

def store_for_user(fields, entry):
    device = fields.get('Device ID', '').strip()
    email = fields.get('Email', '').strip().lower()
    if device:
        cfg.setdefault('devices', {})[device] = dict(entry)
    if email:
        cfg.setdefault('users', {})[email] = dict(entry)
    return device, email

def edit_message(chat_id, message_id, text, keyboard=None):
    payload = {'chat_id': chat_id, 'message_id': message_id, 'text': text}
    if keyboard is not None:
        payload['reply_markup'] = keyboard
    call('editMessageText', payload)

def confirm_admin(chat_id, text):
    try:
        call('sendMessage', {'chat_id': chat_id, 'text': text})
    except Exception as exc:
        print('admin confirmation warning:', exc)

last_update = int(telegram_state.get('lastUpdateId') or 0)
updates = call('getUpdates', {
    'offset': last_update + 1,
    'limit': 100,
    'timeout': 0,
    'allowed_updates': ['message', 'callback_query'],
}) or []

max_update = last_update
admin_user_id = str(config.get('telegramAdminUserId') or '').strip()
admin_chat_id = str(config.get('telegramAdminChatId') or '').strip()
changed = False

for update in updates:
    update_id = int(update.get('update_id') or 0)
    max_update = max(max_update, update_id)

    message = update.get('message') or {}
    if message:
        chat = message.get('chat') or {}
        sender = message.get('from') or {}
        text = str(message.get('text') or '').strip()
        if not admin_user_id and chat.get('type') == 'private' and text.startswith('/start'):
            admin_user_id = str(sender.get('id') or '').strip()
            admin_chat_id = str(chat.get('id') or '').strip()
            if admin_user_id and admin_chat_id:
                config['telegramAdminUserId'] = admin_user_id
                config['telegramAdminChatId'] = admin_chat_id
                changed = True
                call('sendMessage', {
                    'chat_id': admin_chat_id,
                    'text': '✅ AstroSathi Admin connected. New premium requests can now be sent to this chat.'
                })
                print('Registered AstroSathi Telegram admin:', admin_user_id)

    callback = update.get('callback_query') or {}
    if not callback:
        continue

    callback_id = str(callback.get('id') or '')
    sender_id = str((callback.get('from') or {}).get('id') or '')
    if not admin_user_id or sender_id != admin_user_id:
        answer(callback_id, 'Not authorized for AstroSathi admin actions.')
        continue

    data = str(callback.get('data') or '')
    msg = callback.get('message') or {}
    chat_id = str((msg.get('chat') or {}).get('id') or '')
    message_id = msg.get('message_id')
    fields = parse_fields(str(msg.get('text') or ''))
    request_id = fields.get('Request ID', '')
    if ':' not in data:
        answer(callback_id, 'Invalid admin action.')
        continue
    action, callback_request_id = data.split(':', 1)
    if not request_id or callback_request_id != request_id:
        answer(callback_id, 'Request ID mismatch.')
        continue

    name = fields.get('Name', '')
    email = fields.get('Email', '').lower()
    device = fields.get('Device ID', '')
    utr = fields.get('UTR', '')
    amount = fields.get('Amount', '')
    who = name or email or device or 'this user'
    decision_at = datetime.now(timezone.utc)

    if action == 'A':
        minutes = safe_duration()
        approved = decision_at
        expires = approved + timedelta(minutes=minutes)
        entry = {
            'status': 'approved',
            'requestId': request_id,
            'decisionAt': iso(decision_at),
            'approvedAt': iso(approved),
            'expiresAt': iso(expires),
            'durationMinutes': minutes,
            'message': f'Payment verified. Premium is active until {iso(expires)}.'
        }
        store_for_user(fields, entry)
        changed = True
        text = '\n'.join([
            '✅ PREMIUM APPROVED',
            f'Request ID: {request_id}',
            f'Name: {name}',
            f'Email: {email}',
            f'Device ID: {device}',
            f'UTR: {utr}',
            f'Amount: {amount}',
            f'Approved: {iso(approved)}',
            f'Expires: {iso(expires)}',
            f'Duration: {minutes} minutes',
        ])
        keyboard = {'inline_keyboard': [[{'text': '⛔ STOP PREMIUM', 'callback_data': f'S:{request_id}'}]]}
        edit_message(chat_id, message_id, text, keyboard)
        answer(callback_id, f'Approved for {minutes} minutes.')
        confirm_admin(chat_id, '\n'.join([
            f'✅ You approved {who}.',
            f'Email: {email or "—"}',
            f'Amount: {amount or "—"}',
            f'Duration: {minutes} minutes',
            f'Expires: {iso(expires)}',
            'The user app is now eligible for Premium.'
        ]))

    elif action == 'R':
        entry = {
            'status': 'rejected',
            'requestId': request_id,
            'decisionAt': iso(decision_at),
            'message': 'Premium request rejected by the AstroSathi admin.'
        }
        store_for_user(fields, entry)
        changed = True
        text = '\n'.join([
            '❌ PREMIUM REQUEST REJECTED',
            f'Request ID: {request_id}',
            f'Name: {name}',
            f'Email: {email}',
            f'Device ID: {device}',
            f'UTR: {utr}',
            f'Amount: {amount}',
        ])
        edit_message(chat_id, message_id, text, {'inline_keyboard': []})
        answer(callback_id, 'Request rejected.')
        confirm_admin(chat_id, f'❌ You rejected the premium request for {who}.')

    elif action == 'S':
        stopped = {
            'status': 'stopped',
            'requestId': request_id,
            'decisionAt': iso(decision_at),
            'message': 'Premium access was stopped by the AstroSathi admin.'
        }
        existing_device = cfg.setdefault('devices', {}).get(device, {}) if device else {}
        existing_user = cfg.setdefault('users', {}).get(email, {}) if email else {}
        if device:
            cfg['devices'][device] = {**existing_device, **stopped}
        if email:
            cfg['users'][email] = {**existing_user, **stopped}
        changed = True
        text = '\n'.join([
            '⛔ PREMIUM STOPPED',
            f'Request ID: {request_id}',
            f'Name: {name}',
            f'Email: {email}',
            f'Device ID: {device}',
            f'UTR: {utr}',
            f'Amount: {amount}',
        ])
        edit_message(chat_id, message_id, text, {'inline_keyboard': []})
        answer(callback_id, 'Premium stopped.')
        confirm_admin(chat_id, f'⛔ You stopped Premium for {who}.')
    else:
        answer(callback_id, 'Unknown admin action.')

if max_update != last_update:
    telegram_state['lastUpdateId'] = max_update
    changed = True

if changed:
    control_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + '\n')
    print('Updated AstroSathi premium control state.')
else:
    print('No AstroSathi Telegram updates to apply.')
