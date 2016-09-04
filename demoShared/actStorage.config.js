(function (angular) {
    'use strict';

    angular.module('demo').run(function () {

        var itemsToSet = {
            znkAuthToken:   'JPv3aL174i2MDkfFVRjqM7YCfeJ7Qc3Udc9qw0ql',
            znkData: 'https://act-dev.firebaseio.com/',
            znkStudentPath: '/act_app'
        };

        angular.forEach(itemsToSet, function(val, name){
            localStorage.setItem(name, val);
        });
    });
})(angular);
