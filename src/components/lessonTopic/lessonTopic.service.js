(function (angular) {
    'use strict';

    angular.module('znk.infra-act.lessonTopic').service('LessonTopicService', function (SubjectEnum, LiveSessionSubjectEnum, $log) {
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
    });
})(angular);
