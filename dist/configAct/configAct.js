(function (angular) {
    'use strict';

    angular.module('znk.infra-act.configAct', []);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('EstimatedScoreSrv', ["$delegate", "ScoringService", "SubjectEnum", function ($delegate, ScoringService, SubjectEnum) {
            'ngInject';

            var decoratedEstimatedScoreSrv = $delegate;

            var getEstimatedScoresFn = $delegate.getEstimatedScores;

            decoratedEstimatedScoreSrv.getEstimatedScores = function () {
                return $delegate.getLatestEstimatedScore().then(function (latestScores) {
                    var estimatedScores = {};
                    angular.forEach(latestScores, function (estimatedScore, subjectId) {
                        estimatedScores[subjectId] = Math.round(estimatedScore.score) || 0;
                    });
                    return estimatedScores;
                });
            };

            decoratedEstimatedScoreSrv.getEstimatedScoresData = function () {
                return getEstimatedScoresFn.apply($delegate).then(function (estimatedScoresData) {
                    var estimatedScores = {};
                    angular.forEach(estimatedScoresData, function (estimatedScore, subjectId) {
                        estimatedScores[subjectId] = [];
                        angular.forEach(estimatedScore, function (value) {
                            value.score = Math.round(value.score) || 0;
                            estimatedScores[subjectId].push(value);
                        });
                    });
                    return estimatedScores;
                });
            };

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

angular.module('znk.infra-act.configAct').run(['$templateCache', function($templateCache) {

}]);
