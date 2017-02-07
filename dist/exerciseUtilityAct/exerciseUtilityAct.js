(function (angular) {
    'use strict';

    angular.module('znk.infra-act.exerciseUtilityAct', []);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-act.exerciseUtilityAct')
        .service('TestScoreCategoryEnum',["EnumSrv", function(EnumSrv) {
            'ngInject';

            var testScoreCategoryEnum = new EnumSrv.BaseEnum([
                ['MATH', 9, 'math'],
                ['READING', 10, 'reading'],
                ['WRITING', 11, 'writing'],
                ['ESSAY', 12, 'essay']
            ]);
            return testScoreCategoryEnum;
        }]);
})(angular);

angular.module('znk.infra-act.exerciseUtilityAct').run(['$templateCache', function($templateCache) {

}]);
