
-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS on_order_created ON orders;
DROP TRIGGER IF EXISTS on_message_received ON platform_messages;

-- Create or Replace Function for New Orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  message_text text;
BEGIN
  -- Construct the message
  message_text := format(
    E'🆕 <b>Новый заказ!</b>\n' ||
    E'🆔 #%s\n' ||
    E'📦 <b>Товар:</b> %s\n' ||
    E'💰 <b>Сумма:</b> %s ₽\n' ||
    E'🌐 <b>Платформа:</b> %s',
    left(NEW.id::text, 8),
    COALESCE(NEW.product_name, 'Неизвестный товар'),
    COALESCE(NEW.total_amount, 0),
    COALESCE(NEW.platform, NEW.source, 'Неизвестно')
  );

  -- Send POST request to Edge Function
  PERFORM
    net.http_post(
        url := 'https://ynagmhidxfesjqioftbc.supabase.co/functions/v1/telegram-bot',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.header.apikey', true) || '"}'::jsonb,
        body := jsonb_build_object(
            'action', 'notify_all_staff',
            'message', message_text
        )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for Orders
CREATE TRIGGER on_order_created
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_new_order();


-- Create or Replace Function for New Messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  client_name_val text;
  platform_val text;
  message_text text;
BEGIN
  -- Only notify for client messages
  IF NEW.sender != 'shop' THEN
    
    -- Fetch client details
    SELECT client_name, platform 
    INTO client_name_val, platform_val 
    FROM platform_chats 
    WHERE id = NEW.chat_id;

    -- Construct the message
    message_text := format(
      E'📩 <b>Новое сообщение!</b>\n' ||
      E'👤 <b>Клиент:</b> %s\n' ||
      E'🌐 <b>Платформа:</b> %s\n' ||
      E'💬 <i>"%s"</i>',
      COALESCE(client_name_val, 'Неизвестный'),
      COALESCE(platform_val, 'Неизвестно'),
      left(NEW.text, 200) -- Truncate long messages
    );

    -- Send POST request
    PERFORM
        net.http_post(
            url := 'https://ynagmhidxfesjqioftbc.supabase.co/functions/v1/telegram-bot',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.header.apikey', true) || '"}'::jsonb,
            body := jsonb_build_object(
                'action', 'notify_all_staff',
                'message', message_text
            )
        );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for Messages
CREATE TRIGGER on_message_received
AFTER INSERT ON platform_messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
