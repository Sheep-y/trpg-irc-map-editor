<?php

$out = array(
  'app_version' => '20101025',
  'language' => 'en',
  'title' => 'Map1',
);

/**
 * Display a full map page
 */
function display_full_map() {
  $tbs = template_load('map_template');
  $tbs->Show();
}

/**
 * Load a template.
 * @param $name Template name without path and extension.
 */
function template_load($name) {
  global $tbs, $out;
  if (!isset($tbs)) {
    include_once('tbs/tbs_class.php');
    $tbs = & new clsTinyButStrong();
    // TODO: Set gzip compression on
  }
  if ($name) {
    $tbs->LoadTemplate("html/$name.html");
    $tbs->Source = str_replace('../html/', 'html/', $tbs->Source);
  }
  return $tbs;
}

?>
