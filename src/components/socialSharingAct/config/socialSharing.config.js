(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .config(function(SocialSharingSrvProvider){
            SocialSharingSrvProvider.setPoints({
                25: {
                    background: 'background-lowest',
                    banner1: 'summary-congrats-banner-600-1',
                    banner2: 'summary-congrats-banner-600-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-25.png',
                        english: 'ACT-FB-share-post-english-25.png',
                        reading: 'ACT-FB-share-post-reading-25.png',
                        science: 'ACT-FB-share-post-science-25.png',
                        writing: 'ACT-FB-share-post-writing-25.png'
                    }
                },
                28: {
                    background: 'background-middle-1',
                    banner1: 'summary-congrats-banner-650-1',
                    banner2: 'summary-congrats-banner-650-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-28.png',
                        english: 'ACT-FB-share-post-english-28.png',
                        reading: 'ACT-FB-share-post-reading-28.png',
                        science: 'ACT-FB-share-post-science-28.png',
                        writing: 'ACT-FB-share-post-writing-28.png'
                    }
                },
                30: {
                    background: 'background-middle-2',
                    banner1: 'summary-congrats-banner-700-1',
                    banner2: 'summary-congrats-banner-700-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-30.png',
                        english: 'ACT-FB-share-post-english-30.png',
                        reading: 'ACT-FB-share-post-reading-30.png',
                        science: 'ACT-FB-share-post-science-30.png',
                        writing: 'ACT-FB-share-post-writing-30.png'
                    }
                },
                33: {
                    background: 'background-highest',
                    banner1: 'summary-congrats-banner-750-1',
                    banner2: 'summary-congrats-banner-750-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-33.png',
                        english: 'ACT-FB-share-post-english-33.png',
                        reading: 'ACT-FB-share-post-reading-33.png',
                        science: 'ACT-FB-share-post-science-33.png',
                        writing: 'ACT-FB-share-post-writing-33.png'
                    }
                },
                improved: {
                    background: 'background-improved',
                    banner1: 'summary-congrats-banner-improved-1',
                    banner2: 'summary-congrats-banner-improved-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-improved.png',
                        english: 'ACT-FB-share-post-english-improved.png',
                        reading: 'ACT-FB-share-post-reading-improved.png',
                        science: 'ACT-FB-share-post-science-improved.png',
                        writing: 'ACT-FB-share-post-writing-improved.png'
                    }
                }
            });
        });
})(angular);
