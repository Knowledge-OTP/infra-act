(function (angular) {
    'use strict';

    angular.module('znk.infra-act.configAct', []);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('CategoryService', ["$delegate", "SubjectEnum", function ($delegate, SubjectEnum) {
            'ngInject';

            $delegate.getAllSubscores = function () {
                return $delegate.getCategoryMap().then(function (categories) {
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

            return $delegate;
        }]);
})();

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('EstimatedScoreSrv', ["$delegate", "ScoringService", "SubjectEnum", function ($delegate, ScoringService, SubjectEnum) {
            'ngInject';

            var decoratedEstimatedScoreSrv = $delegate;

            decoratedEstimatedScoreSrv.getCompositeScore = function () {
                return $delegate.getLatestEstimatedScore().then(function (estimatedScores) {
                    var scoresArr = [];
                    angular.forEach(estimatedScores, function (estimatesScoreForSubject, subjectId) {
                        if (+subjectId !== SubjectEnum.WRITING.enum) {
                            scoresArr.push(estimatesScoreForSubject.score || 0);
                        }
                    });
                    return ScoringService.getScoreCompositeResult(scoresArr);
                });
            };

            return decoratedEstimatedScoreSrv;
        }]);
})();

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('SubjectEnum', ["$delegate", function ($delegate) {
            'ngInject';

            var relevantSubjects = ['ENGLISH', 'MATH', 'READING', 'SCIENCE', 'WRITING'];
            angular.forEach($delegate, function (value, key) {
                if (relevantSubjects.indexOf(key) === -1) {
                    delete $delegate[key];
                }
            });
            return $delegate;
        }]);
})();

angular.module('znk.infra-act.configAct').run(['$templateCache', function ($templateCache) {
  $templateCache.put("components/configAct/svg/znk-app-name-logo.svg",
    "<svg version=\"1.1\" id=\"ACT\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" viewBox=\"-183 363 245 67\" class=\"znk-app-name-logo\">\n" +
    "<style type=\"text/css\">\n" +
    "	.znk-app-name-logo .st0{enable-background:new    ;}\n" +
    "	.znk-app-name-logo .st1{fill:#87CA4D;}\n" +
    "	.znk-app-name-logo .st2{fill:#A1A1A1;}\n" +
    "	.znk-app-name-logo .st3{fill:none;enable-background:new    ;}\n" +
    "	.znk-app-name-logo .st4{fill:#000001;}\n" +
    "</style>\n" +
    "<g class=\"st0\">\n" +
    "	<path class=\"st1\" d=\"M-60.9,395.9l-4,8.9h-7.3l17.8-39.2h7.3l17.8,39.2h-7.3l-4-8.9H-60.9z M-43.5,389.8l-7.3-16.1l-7.3,16.1H-43.5\n" +
    "		z\"/>\n" +
    "	<path class=\"st1\" d=\"M-5.4,398.9c2.3,0,4.4-0.4,6.1-1.1c1.7-0.8,3.5-2,5.3-3.7l4.4,4.4c-4.3,4.6-9.4,6.9-15.5,6.9\n" +
    "		s-11.2-1.9-15.2-5.7c-4-3.8-6-8.6-6-14.5s2-10.7,6.1-14.6c4.1-3.9,9.3-5.8,15.5-5.8c6.2,0,11.5,2.2,15.7,6.7L6.6,376\n" +
    "		c-1.9-1.8-3.7-3-5.5-3.8c-1.7-0.7-3.7-1.1-6-1.1c-4.1,0-7.5,1.3-10.3,3.8c-2.8,2.6-4.2,5.8-4.2,9.8c0,4,1.4,7.3,4.1,10\n" +
    "		C-12.5,397.5-9.2,398.9-5.4,398.9z\"/>\n" +
    "	<path class=\"st1\" d=\"M33.8,371.7v33.1H27v-33.1H14.8v-6.1h31.3v6.1H33.8z\"/>\n" +
    "</g>\n" +
    "<path class=\"st1\" d=\"M55.4,363c3.4-0.2,6.4,2.4,6.6,5.9s-2.4,6.4-5.9,6.6c-0.2,0-0.5,0-0.7,0c-3.4,0.2-6.4-2.4-6.7-5.8\n" +
    "	c-0.2-3.4,2.4-6.4,5.8-6.7C54.8,363,55.1,363,55.4,363L55.4,363z M55.3,364.3c-2.7,0-4.9,2.3-4.9,5c0,2.7,2.3,4.9,5,4.9\n" +
    "	c2.7,0,4.9-2.1,4.9-4.8c0-0.1,0-0.1,0-0.2c0-2.7-2.1-5-4.8-5C55.4,364.3,55.4,364.3,55.3,364.3L55.3,364.3L55.3,364.3z M54.3,372.4\n" +
    "	h-1.5v-6.2c0.8-0.1,1.7-0.2,2.5-0.2c0.8-0.1,1.5,0.1,2.2,0.5c0.4,0.3,0.7,0.8,0.7,1.3c-0.1,0.7-0.6,1.3-1.3,1.5v0.1\n" +
    "	c0.6,0.2,1.1,0.8,1.1,1.5c0.1,0.5,0.2,1,0.5,1.5h-1.6c-0.3-0.5-0.4-1-0.5-1.5c-0.1-0.6-0.7-1-1.3-1c0,0,0,0-0.1,0h-0.7L54.3,372.4\n" +
    "	L54.3,372.4z M54.4,369h0.7c0.8,0,1.5-0.3,1.5-0.9c0-0.6-0.4-0.9-1.4-0.9c-0.3,0-0.6,0-0.8,0.1L54.4,369L54.4,369z\"/>\n" +
    "<g class=\"st0\">\n" +
    "	<path class=\"st2\" d=\"M-53,417v1.5h-4.2V430H-59v-11.5h-4.2V417H-53z\"/>\n" +
    "	<path class=\"st2\" d=\"M-43.2,417v1.4h-6.2v4.3h5v1.4h-5v4.4h6.2v1.4h-8v-13H-43.2z\"/>\n" +
    "	<path class=\"st2\" d=\"M-34,419.1c-0.1,0.1-0.1,0.2-0.2,0.2c-0.1,0-0.1,0.1-0.2,0.1c-0.1,0-0.2-0.1-0.4-0.2s-0.3-0.2-0.5-0.3\n" +
    "		c-0.2-0.1-0.5-0.2-0.8-0.3s-0.6-0.2-1.1-0.2c-0.4,0-0.7,0.1-1,0.2c-0.3,0.1-0.6,0.2-0.8,0.4c-0.2,0.2-0.4,0.4-0.5,0.6\n" +
    "		c-0.1,0.2-0.2,0.5-0.2,0.8c0,0.4,0.1,0.7,0.3,0.9c0.2,0.2,0.4,0.4,0.7,0.6c0.3,0.2,0.6,0.3,1,0.4c0.4,0.1,0.8,0.3,1.1,0.4\n" +
    "		c0.4,0.1,0.8,0.3,1.1,0.4c0.4,0.2,0.7,0.4,1,0.6c0.3,0.3,0.5,0.6,0.7,0.9c0.2,0.4,0.3,0.8,0.3,1.4c0,0.6-0.1,1.1-0.3,1.6\n" +
    "		c-0.2,0.5-0.5,0.9-0.8,1.3c-0.4,0.4-0.8,0.7-1.4,0.9s-1.2,0.3-1.8,0.3c-0.8,0-1.6-0.2-2.3-0.5c-0.7-0.3-1.3-0.7-1.8-1.2l0.5-0.8\n" +
    "		c0-0.1,0.1-0.1,0.2-0.2c0.1,0,0.1-0.1,0.2-0.1c0.1,0,0.3,0.1,0.4,0.2s0.4,0.3,0.6,0.4s0.5,0.3,0.9,0.4c0.3,0.1,0.8,0.2,1.3,0.2\n" +
    "		c0.4,0,0.8-0.1,1.1-0.2s0.6-0.3,0.8-0.5c0.2-0.2,0.4-0.5,0.5-0.7c0.1-0.3,0.2-0.6,0.2-1c0-0.4-0.1-0.7-0.3-1s-0.4-0.5-0.7-0.6\n" +
    "		c-0.3-0.2-0.6-0.3-1-0.4c-0.4-0.1-0.8-0.2-1.1-0.4c-0.4-0.1-0.8-0.3-1.1-0.4s-0.7-0.4-1-0.6c-0.3-0.3-0.5-0.6-0.7-1\n" +
    "		s-0.3-0.9-0.3-1.4c0-0.5,0.1-0.9,0.3-1.3s0.4-0.8,0.8-1.1s0.8-0.6,1.3-0.8s1.1-0.3,1.7-0.3c0.7,0,1.4,0.1,2,0.3\n" +
    "		c0.6,0.2,1.1,0.6,1.6,1L-34,419.1z\"/>\n" +
    "	<path class=\"st2\" d=\"M-22.2,417v1.5h-4.2V430h-1.8v-11.5h-4.2V417H-22.2z\"/>\n" +
    "	<path class=\"st2\" d=\"M-15,425.2v4.8h-1.7v-13h3.8c0.8,0,1.5,0.1,2.1,0.3c0.6,0.2,1.1,0.5,1.5,0.8s0.7,0.8,0.9,1.3s0.3,1,0.3,1.7\n" +
    "		c0,0.6-0.1,1.2-0.3,1.7c-0.2,0.5-0.5,0.9-0.9,1.3c-0.4,0.4-0.9,0.6-1.5,0.8s-1.3,0.3-2.1,0.3H-15z M-15,423.8h2.1\n" +
    "		c0.5,0,0.9-0.1,1.3-0.2c0.4-0.1,0.7-0.3,1-0.6c0.3-0.2,0.5-0.5,0.6-0.9c0.1-0.3,0.2-0.7,0.2-1.1c0-0.8-0.3-1.5-0.8-1.9\n" +
    "		c-0.5-0.5-1.3-0.7-2.3-0.7H-15V423.8z\"/>\n" +
    "	<path class=\"st2\" d=\"M-3.9,424.6v5.4h-1.7v-13H-2c0.8,0,1.5,0.1,2.1,0.2c0.6,0.2,1.1,0.4,1.5,0.7c0.4,0.3,0.7,0.7,0.9,1.1\n" +
    "		s0.3,0.9,0.3,1.5c0,0.5-0.1,0.9-0.2,1.3c-0.1,0.4-0.4,0.8-0.6,1.1s-0.6,0.6-1,0.8c-0.4,0.2-0.8,0.4-1.3,0.5\n" +
    "		c0.2,0.1,0.4,0.3,0.6,0.6l3.8,5.1H2.3c-0.3,0-0.6-0.1-0.7-0.4l-3.4-4.6c-0.1-0.1-0.2-0.2-0.3-0.3c-0.1-0.1-0.3-0.1-0.5-0.1H-3.9z\n" +
    "		 M-3.9,423.3h1.8c0.5,0,1-0.1,1.4-0.2c0.4-0.1,0.7-0.3,1-0.5c0.3-0.2,0.5-0.5,0.6-0.8s0.2-0.7,0.2-1c0-0.8-0.3-1.4-0.8-1.7\n" +
    "		c-0.5-0.4-1.3-0.6-2.3-0.6h-1.9V423.3z\"/>\n" +
    "	<path class=\"st2\" d=\"M13.8,417v1.4H7.6v4.3h5v1.4h-5v4.4h6.2v1.4h-8v-13H13.8z\"/>\n" +
    "	<path class=\"st2\" d=\"M18.2,425.2v4.8h-1.7v-13h3.8c0.8,0,1.5,0.1,2.1,0.3c0.6,0.2,1.1,0.5,1.5,0.8s0.7,0.8,0.9,1.3s0.3,1,0.3,1.7\n" +
    "		c0,0.6-0.1,1.2-0.3,1.7c-0.2,0.5-0.5,0.9-0.9,1.3c-0.4,0.4-0.9,0.6-1.5,0.8s-1.3,0.3-2.1,0.3H18.2z M18.2,423.8h2.1\n" +
    "		c0.5,0,0.9-0.1,1.3-0.2c0.4-0.1,0.7-0.3,1-0.6c0.3-0.2,0.5-0.5,0.6-0.9c0.1-0.3,0.2-0.7,0.2-1.1c0-0.8-0.3-1.5-0.8-1.9\n" +
    "		c-0.5-0.5-1.3-0.7-2.3-0.7h-2.1V423.8z\"/>\n" +
    "</g>\n" +
    "<path class=\"st3\"/>\n" +
    "<circle id=\"XMLID_137_\" class=\"st4\" cx=\"-111.1\" cy=\"404\" r=\"5.7\"/>\n" +
    "<path id=\"XMLID_136_\" class=\"st4\" d=\"M-134.4,430c4.2,0,7.7-3.4,7.7-7.7c0-4.2-3.4-7.7-7.7-7.7c-4.2,0-7.7,3.4-7.7,7.7\n" +
    "	C-142.1,426.6-138.7,430-134.4,430z\"/>\n" +
    "<path id=\"XMLID_135_\" class=\"st4\" d=\"M-112.1,393.5c-6.5-4-14.2-6.3-22.3-6.3c-8.1,0-15.8,2.3-22.3,6.3c5.4,0.5,9.6,5.1,9.6,10.6\n" +
    "	c0,0.7-0.1,1.4-0.2,2.1c3.9-2.1,8.3-3.3,13-3.3c4.7,0,9.1,1.2,13,3.3c-0.1-0.7-0.2-1.4-0.2-2.1C-121.7,398.5-117.5,394-112.1,393.5z\n" +
    "	\"/>\n" +
    "<path id=\"XMLID_134_\" class=\"st4\" d=\"M-168.4,404.2c-3.3,4.5-5.8,9.7-7.2,15.4c-0.5,2-0.2,4.1,0.9,5.9c1.1,1.8,2.8,3,4.8,3.5\n" +
    "	c0.6,0.1,1.2,0.2,1.8,0.2c3.6,0,6.8-2.5,7.6-6c0.8-3.2,2.1-6.1,3.8-8.6c-0.4,0-0.8,0.1-1.2,0.1C-163.6,414.7-168.3,410-168.4,404.2z\n" +
    "	\"/>\n" +
    "<path id=\"XMLID_132_\" class=\"st4\" d=\"M-87.4,403.8c0.2-2.8,2.7-32.3-1.9-36.6c-3.9-3.7-24.9,6.6-32,10.3\n" +
    "	C-106.8,381.2-94.5,390.7-87.4,403.8z\"/>\n" +
    "<circle id=\"XMLID_131_\" class=\"st4\" cx=\"-157.8\" cy=\"404\" r=\"5.7\"/>\n" +
    "<path id=\"XMLID_130_\" class=\"st4\" d=\"M-111.1,414.7c-0.4,0-0.8,0-1.3-0.1c1.7,2.6,3.1,5.5,3.8,8.7c0.8,3.5,4,6,7.6,6\n" +
    "	c0.6,0,1.2-0.1,1.8-0.2c4.2-1,6.8-5.2,5.8-9.4c-1.4-5.7-3.9-10.9-7.2-15.4C-100.5,410-105.3,414.7-111.1,414.7z\"/>\n" +
    "<path id=\"XMLID_129_\" class=\"st4\" d=\"M-147.6,377.6c-7.1-3.7-28.1-14.1-32-10.3c-4.5,4.3-2.1,33.7-1.9,36.6\n" +
    "	C-174.4,390.7-162.1,381.2-147.6,377.6z\"/>\n" +
    "</svg>\n" +
    "");
}]);
