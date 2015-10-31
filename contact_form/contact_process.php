<?php

$subject = $_POST['subject'];
$name = $_POST['name'];
$mail_subject = "[Contact] " . $name . ": " . $subject;

$message = $_POST['message'];
$from = $_POST['email'];
$headers = "From:" . $from;

if (empty($name) || empty($message) || empty($from)) {
    echo "Nothing should happen...";
} else {
    $to = "xing.y.hu@gmail.com";
    mail($to,$mail_subject,$message,$headers);
    echo "Mail Sent.";
}

?>