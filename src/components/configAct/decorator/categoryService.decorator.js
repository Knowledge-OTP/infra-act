(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('CategoryService', function ($delegate, SubjectEnum) {
            'ngInject';

            var categoryService = $delegate;

            categoryService.getAllSubscores = function () {
                return categoryService.getCategoryMap().then(function (categories) {
                    var subScoreObj = {};
                    for (var prop in categories) {
                        if (_isSubScore(categories[prop].parentId)) {
                            subScoreObj[categories[prop].id] = categories[prop];
                        }
                    }
                    return subScoreObj;
                });
            };

            function _isSubScore(id) {
                return SubjectEnum.MATH.enum === id || SubjectEnum.READING.enum === id ||
                    SubjectEnum.WRITING.enum === id || SubjectEnum.ENGLISH.enum === id ||
                    SubjectEnum.SCIENCE.enum === id;
            }

            return categoryService;
        });
})();
