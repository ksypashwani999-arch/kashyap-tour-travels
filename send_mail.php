<?php
// ── SMTP Configuration (Gmail App Password required) ──
define('SMTP_HOST',      'ssl://smtp.gmail.com');
define('SMTP_PORT',      465);
define('SMTP_USER',      'ksyp.ashwani999@gmail.com');  // Gmail address
define('SMTP_PASS',      'cbplxlgvljtzgasc');             // Gmail App Password
define('MAIL_TO',        'ksyp.ashwani999@gmail.com');
define('MAIL_FROM_NAME', 'Kashyap Tour & Travels Website');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

// Sanitize inputs
function clean($val) {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$name    = clean($_POST['name']    ?? '');
$phone   = clean($_POST['phone']   ?? '');
$email   = clean($_POST['email']   ?? '');
$from    = clean($_POST['from']    ?? '');
$to      = clean($_POST['to']      ?? '');
$date    = clean($_POST['date']    ?? '');
$vehicle = clean($_POST['vehicle'] ?? 'Not specified');
$message = clean($_POST['message'] ?? 'None');

// Basic validation
if (empty($name) || empty($phone) || empty($from) || empty($to) || empty($date)) {
    echo json_encode(['success' => false, 'message' => 'Please fill all required fields.']);
    exit;
}

// Build email body
$subject = "New Booking Enquiry from $name – Kashyap Tour & Travels";

$body  = "===========================================\n";
$body .= "   NEW BOOKING ENQUIRY – Kashyap Tour & Travels\n";
$body .= "===========================================\n\n";
$body .= "Name    : $name\n";
$body .= "Phone   : $phone\n";
$body .= "Email   : " . ($email ?: 'Not provided') . "\n\n";
$body .= "From    : $from\n";
$body .= "To      : $to\n";
$body .= "Date    : $date\n";
$body .= "Vehicle : $vehicle\n\n";
$body .= "Message :\n$message\n\n";
$body .= "===========================================\n";
$body .= "Sent from: kashyaptourstravels.com\n";

// ── Send via Gmail SMTP ──
$result = sendSmtpMail(MAIL_TO, $subject, $body, $name, $phone);

if ($result === true) {
    echo json_encode(['success' => true, 'message' => 'Your enquiry has been sent! We will contact you shortly.']);
} else {
    // Log error for debugging
    error_log("Mail error: $result");
    echo json_encode(['success' => false, 'message' => 'Mail could not be sent. Please call us directly at +91 70187 68317.']);
}

// ── SMTP Function (no external library needed) ──
function sendSmtpMail($to, $subject, $body, $senderName, $senderPhone) {
    $socket = @stream_socket_client(SMTP_HOST . ':' . SMTP_PORT, $errno, $errstr, 15);
    if (!$socket) {
        return "Connection failed: $errstr ($errno)";
    }

    stream_set_timeout($socket, 15);

    $steps = [
        null,                                                  // read banner
        "EHLO localhost\r\n",
        "AUTH LOGIN\r\n",
        base64_encode(SMTP_USER) . "\r\n",
        base64_encode(SMTP_PASS) . "\r\n",
        "MAIL FROM:<" . SMTP_USER . ">\r\n",
        "RCPT TO:<$to>\r\n",
        "DATA\r\n",
        buildMimeMessage($to, $subject, $body, $senderName) . "\r\n.\r\n",
        "QUIT\r\n",
    ];

    $expectedCodes = [220, 250, 334, 334, 235, 250, 250, 354, 250, 221];

    foreach ($steps as $i => $cmd) {
        if ($cmd !== null) {
            fwrite($socket, $cmd);
        }
        $response = fgets($socket, 512);
        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCodes[$i]) {
            fclose($socket);
            return "SMTP step $i failed. Code: $code, Response: $response";
        }
    }

    fclose($socket);
    return true;
}

function buildMimeMessage($to, $subject, $body, $senderName) {
    $from = SMTP_USER;
    $fromName = MAIL_FROM_NAME;
    $date = date('r');
    $msgId = '<' . uniqid('kt', true) . '@kashyaptravels.in>';

    return "Date: $date\r\n"
         . "Message-ID: $msgId\r\n"
         . "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$from>\r\n"
         . "To: $to\r\n"
         . "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n"
         . "MIME-Version: 1.0\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "Content-Transfer-Encoding: base64\r\n"
         . "\r\n"
         . chunk_split(base64_encode($body));
}
