
UPDATE storage.buckets SET file_size_limit = 2147483648 WHERE id = 'films';
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'thumbs';
UPDATE storage.buckets SET file_size_limit = 20971520 WHERE id = 'portfolios';
UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'avatars';
