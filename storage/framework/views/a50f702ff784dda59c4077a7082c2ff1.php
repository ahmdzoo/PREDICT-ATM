<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
        <title><?php echo e(config('app.name', 'Mini ATM Predict')); ?></title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
        <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/js/main.jsx']); ?>
    </head>
    <body class="font-sans antialiased bg-gray-50 text-gray-900">
        <div id="root"></div>
    </body>
</html>
<?php /**PATH D:\mini-atm-predict\resources\views/app.blade.php ENDPATH**/ ?>