<?php

$name = $_POST['name'];
$message = $_POST['message'];
$from = $_POST['email'];
$headers = "From:" . $from;

if (empty($name) || empty($message) || empty($from)) {
    echo "Nothing should happen...";
} else {
    $to = "xing.y.hu@gmail.com";
    mail($to,$name,$message,$headers);
    echo "Mail Sent.";
}

?>