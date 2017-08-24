(function (angular) {
    function AuthService($q) {
        return {
            getAuth: function () {
                return new Promise(resolve => resolve({
                    uid: '$$$$uid',
                    email: 'fake@email.com'
                }));
            },
            userDataForAuthAndDataFb: function () {
                return $q.when([
                    {
                        auth: {
                            name: 'zinkerz',
                            email: 'zinkerz@gmail.com'
                        }
                    },
                    {}
                ]);
            },
            registerFirstLogin: function () {
                return $q.when({});
            }
        };
    }

    angular.module('auth.mock', [])
        .service('AuthService', AuthService);
})(angular);
