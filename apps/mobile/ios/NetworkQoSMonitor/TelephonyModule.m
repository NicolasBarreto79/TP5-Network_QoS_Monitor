#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TelephonyModule, NSObject)

RCT_EXTERN_METHOD(getCellularNetworkInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
