(function (angular) {
    'use strict';

    angular.module('demo', [
        'demoEnv',
        'znk.infra-act.completeExerciseAct'
    ])
        .config(function($sceProvider){
            $sceProvider.enabled(false);
        })
        .run(function ($rootScope, BaseExerciseGetterSrv, ExerciseTypeEnum, ExerciseParentEnum, ScreenSharingSrv) {
            $rootScope.data = {};

            var questionTypeArr = [
                'SIMPLE_QUESTION',
                'MATH_QUESTION',
                'WRITING_SPECIFIC_PARAGRAPH',
                'WRITING_FULL_PASSAGE',
                'READING_QUESTION',
                'ESSAY_QUESTION',
                'LECTURE_QUESTION'
            ];
            $rootScope.questionTypeArr = questionTypeArr;

            $rootScope.data.questionType = questionTypeArr[1];
            // $rootScope.exerciseTypeEnumArr = ExerciseTypeEnum.getEnumArr();
            // $rootScope.data.exerciseType = ExerciseTypeEnum.TUTORIAL;
            //
            // $rootScope.exerciseParentEnumArr = ExerciseParentEnum.getEnumArr();
            // $rootScope.data.exerciseParent = ExerciseParentEnum.TUTORIAL;

            $rootScope.settings = {
                exitAction: function () {
                    alert('exit');
                }
            };

            $rootScope.uidToShareScreenWith = '7fdcdac0-ea4a-4295-9cd6-374cfed5944b';

            $rootScope.shareMyScreen = function (uid) {
                ScreenSharingSrv.shareMyScreen({
                    uid: uid,
                    isTeacher: false
                });
            };

            $rootScope.viewOtherUserScreen = function (uid) {
                ScreenSharingSrv.viewOtherUserScreen({
                    uid: uid,
                    isTeacher: false
                });
            };

            $rootScope.$watch('data', function (data) {
                var questionTypeToExerciseData = {
                    SIMPLE_QUESTION: {
                        exerciseId: 100,
                        exerciseTypeId: ExerciseTypeEnum.PRACTICE.enum,
                        exerciseParentId: 1,
                        exerciseParentTypeId: ExerciseParentEnum.WORKOUT.enum
                    },
                    MATH_QUESTION:{
                        exerciseId: 100,
                        exerciseTypeId: ExerciseTypeEnum.PRACTICE.enum,
                        exerciseParentId: 1,
                        exerciseParentTypeId: ExerciseParentEnum.WORKOUT.enum
                    },
                    WRITING_SPECIFIC_PARAGRAPH:{
                        exerciseId: 231,
                        exerciseTypeId: ExerciseTypeEnum.PRACTICE.enum,
                        exerciseParentId: 1,
                        exerciseParentTypeId: ExerciseParentEnum.WORKOUT.enum
                    },
                    WRITING_FULL_PASSAGE:{
                        exerciseId: 239,
                        exerciseTypeId: ExerciseTypeEnum.PRACTICE.enum,
                        exerciseParentId: 1,
                        exerciseParentTypeId: ExerciseParentEnum.WORKOUT.enum
                    },
                    READING_QUESTION:{
                        exerciseId: 242,
                        exerciseTypeId: ExerciseTypeEnum.PRACTICE.enum,
                        exerciseParentId: 1,
                        exerciseParentTypeId: ExerciseParentEnum.WORKOUT.enum
                    },
                    ESSAY_QUESTION:{
                        exerciseId: 143,
                        exerciseTypeId: ExerciseTypeEnum.PRACTICE.enum,
                        exerciseParentId: 1,
                        exerciseParentTypeId: ExerciseParentEnum.WORKOUT.enum
                    },
                    LECTURE_QUESTION:{
                        exerciseId: 10,
                        exerciseTypeId: ExerciseTypeEnum.LECTURE.enum,
                        exerciseParentId: 11,
                        exerciseParentTypeId: ExerciseParentEnum.MODULE.enum
                    }
                };

                switch(data.questionType){
                    case 'WRITING_FULL_PASSAGE':
                        $rootScope.settings.znkExerciseSettings = {
                            initSlideIndex: 2
                        };
                        break;
                }
                $rootScope.exerciseData = questionTypeToExerciseData[data.questionType];
                // if (!data) {
                //     return;
                // }
                //
                // var exerciseId;
                // var parentId;
                //
                // switch (data.exerciseType.enum) {
                //     case ExerciseTypeEnum.TUTORIAL.enum:
                //         exerciseId = 100;
                //         break;
                //     case ExerciseTypeEnum.PRACTICE.enum:
                //         exerciseId = 240;
                //         break;
                //     case ExerciseTypeEnum.GAME.enum:
                //         alert('no game exercise available');
                //         return;
                //     case ExerciseTypeEnum.SECTION.enum:
                //         exerciseId = 1162;
                //         break;
                //     case ExerciseTypeEnum.DRILL.enum:
                //         alert('no drill exercise available');
                //         return;
                //     case ExerciseTypeEnum.LECTURE.enum:
                //         exerciseId = 12;
                //         break;
                // }
                //
                // switch (data.exerciseParent.enum) {
                //     case ExerciseParentEnum.WORKOUT.enum:
                //         parentId = 10;
                //         break;
                //     case ExerciseParentEnum.EXAM.enum:
                //         parentId = 17;
                //         break;
                //     case ExerciseParentEnum.MODULE.enum:
                //         parentId = 6;
                //         break;
                // }

                // $rootScope.exerciseData = {
                //     exerciseTypeId: data.exerciseType.enum,
                //     exerciseParentTypeId: data.exerciseParent.enum,
                //     exerciseId: exerciseId,
                //     exerciseParentId: parentId
                // };
            }, true);
        });
})(angular);
