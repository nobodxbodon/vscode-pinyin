export function logger(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    var oldFunc: Function = target[propertyKey];
    console.log("log:"+propertyKey);
    console.log(oldFunc);
    target[propertyKey] = function() {
        console.log('call:' + propertyKey);
        oldFunc.apply(this, arguments);
    }
}