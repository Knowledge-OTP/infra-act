(function (angular) {
    'use strict';

    angular.module('znk.infra-act.lessonTopic', [
        'znk.infra.exerciseUtility'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.lessonTopic').service('LessonTopicService', ["SubjectEnum", "LiveSessionSubjectEnum", "$log", function (SubjectEnum, LiveSessionSubjectEnum, $log) {
        'ngInject';
        this.getTopicSubjects = function (topicId) {
            var topicSubjects;

            switch (topicId) {
                case LiveSessionSubjectEnum.ENGLISH.enum:
                    topicSubjects = {
                        reading: SubjectEnum.READING.enum,
                        writing: SubjectEnum.WRITING.enum,
                        english: SubjectEnum.ENGLISH.enum
                    };
                    break;
                case LiveSessionSubjectEnum.MATH.enum:
                    topicSubjects = {
                        math: SubjectEnum.MATH.enum,
                        science: SubjectEnum.SCIENCE.enum
                    };
                    break;
                default:
                    $log.error('Invalid topicId');
            }
            return topicSubjects;
        };
    }]);
})(angular);

angular.module('znk.infra-act.lessonTopic').run(['$templateCache', function($templateCache) {

}]);
