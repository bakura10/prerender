var cache_manager = require('cache-manager');
var s3 = new (require('aws-sdk')).S3({params:{Bucket: process.env.S3_BUCKET_NAME}});

module.exports = {
    init: function() {
        this.cache = cache_manager.caching({
            store: s3_cache, ttl: 10/*seconds*/
        });
    },

    beforePhantomRequest: function(req, res, next) {
        if(req.method !== 'GET') {
            return next();
        }
        
        this.cache.get(req.prerender.url, function (err, result) {
            if (!err && result) {
                console.log('cache hit');
                res.send(200, result.Body);
            } else {
                next();
            }
        });
    },

    afterPhantomRequest: function(req, res, next) {
        this.cache.set(req.prerender.url, req.prerender.documentHTML);
        next();
    }
}


var s3_cache = {
    get: function(key, callback) {
        s3.getObject({
            Key: key
        }, callback);
    },
    set: function(key, value, callback) {
        var request = s3.putObject({
            Key: key,
            ContentType: 'text/html;charset=UTF-8',
            StorageClass: 'REDUCED_REDUNDANCY',
            Body: value
        }, callback);

        if(!callback) {
            request.send();
        }
    }
}