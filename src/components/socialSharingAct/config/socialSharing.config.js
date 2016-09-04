(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .config(function(SocialSharingSrvProvider){
            SocialSharingSrvProvider.setPoints({
                600: {
                    background: 'background-lowest',
                    banner1: 'summary-congrats-banner-600-1',
                    banner2: 'summary-congrats-banner-600-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-600.png',
                        verbal: 'ACT-FB-share-post-verbal-600.png'
                    }
                },
                650: {
                    background: 'background-middle-1',
                    banner1: 'summary-congrats-banner-650-1',
                    banner2: 'summary-congrats-banner-650-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-650.png',
                        verbal: 'ACT-FB-share-post-verbal-650.png'
                    }
                },
                700: {
                    background: 'background-middle-2',
                    banner1: 'summary-congrats-banner-700-1',
                    banner2: 'summary-congrats-banner-700-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-700.png',
                        verbal: 'ACT-FB-share-post-verbal-700.png'
                    }
                },
                750: {
                    background: 'background-highest',
                    banner1: 'summary-congrats-banner-750-1',
                    banner2: 'summary-congrats-banner-750-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-750.png',
                        verbal: 'ACT-FB-share-post-verbal-750.png'
                    }
                },
                improved: {
                    background: 'background-improved',
                    banner1: 'summary-congrats-banner-improved-1',
                    banner2: 'summary-congrats-banner-improved-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-improved.png',
                        verbal: 'ACT-FB-share-post-verbal-improved.png'
                    }
                }
            });
        });
})(angular);
