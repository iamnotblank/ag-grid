<?php
$key = "Angular Group Row";
$pageTitle = "ag-Grid Angular Grouped Row Renderer";
$pageDescription = "ag-Grid Angular Grouped Row Renderer Example";
$pageKeyboards = "ag-Grid angular grouped row component";
$pageGroup = "examples";
include '../documentation-main/documentation_header.php';
?>

<div>

    <h2>Group Row Inner Renderer</h2>
    <p>A Group Row Inner Renderer Example</p>

    <show-complex-example example="../framework-examples/angular-examples/index.html?fromDocs=true&example=group-row"
                          sources="{
                            [
                                { root: '/framework-examples/angular-examples/app/grouped-row-inner-renderer-example/', files: 'group-row-renderer.component.ts,group-row-renderer.component.html,medal-renderer.component.ts' },
                                { root: '/framework-examples/angular-examples/app/', files: 'app.module.ts' }
                            ]
                          }"
                          plunker="https://embed.plnkr.co/hj7OIP/">
    </show-complex-example>
</div>

<?php include '../documentation-main/documentation_footer.php';?>
