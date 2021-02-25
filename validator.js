// Đối tượng 
function Validator(options) {
    // Lấy element cha == selector
    function getParent (element, selector) {
        while (element.parentElement) {
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // Hàn thực hiện validate
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement,options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;

        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        
        //Lặp qua từng rule và kiểm tra
        // nếu có lỗi thì dừng lặp
        for(var i = 0; i < rules.length; i++){
            switch(inputElement.type){
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](formElement.querySelector(rule.selector + ':checked'));
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
                    break;
            }
            if(errorMessage) break;
        }

        if(errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement,options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParent(inputElement,options.formGroupSelector).classList.remove('invalid');
        }
        return !errorMessage;
    }

    //Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    if(formElement){
        // Hủy submit form
        formElement.onsubmit = function(e){
            e.preventDefault();
            var isFormValid = true;
            //Lặp qua từng rule và valid
            options.rules.forEach(function(rule){
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement,rule);
                if(!isValid) isFormValid = false;
            });

            if(isFormValid){
                // Truong hop submit vs JS
                if(typeof options.onSubmit === 'function'){
                    var enabledInputs = formElement.querySelectorAll('[name]:not([disabled])');
                    var formValues = Array.from(enabledInputs).reduce(function(values, input){
                        switch(input.type){
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')) return values;

                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }

                                values[input.name].push(input.value);
                                break;
                            default:
                                values[input.name] = input.value;
                                break;    
                        }
                        return values;
                    },{});
                    options.onSubmit(formValues);
                }
                // Truong hop submit vs hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }

        // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input...)
        options.rules.forEach(function(rule){

            //Lưu lại các rules cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])){
                selectorRules[rule.selector].push(rule.test);
            }
            else{
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);
            
            Array.from(inputElements).forEach(function(inputElement){
                // Xử lý blur khỏi input
                inputElement.onblur = function(){
                    validate(inputElement,rule);
                }

                // Xử lý khi người dùng nhập input
                inputElement.oninput = function(){
                    var errorElement = getParent(inputElement,options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    getParent(inputElement,options.formGroupSelector).classList.remove('invalid');
                }
            })
        })
    }
}

// Định nghĩa rules
Validator.isRequired = function (selector,message) {
    return {
        selector: selector,
        test: function (value){
            return value ? undefined : message || 'Vui lòng nhập vào';
        }
    };
}

Validator.isEmail = function (selector,message){
    return {
        selector: selector,
        test: function (value){
            var regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
            return regex.test(value)? undefined : message || 'Vui lòng nhập email'
        }
    };
}

Validator.minLength = function (selector, min,message){
    return {
        selector: selector,
        test: function (value){
            return value.length >= min ? undefined : message || `Vui lòng nhập đủ ${min} kí tự`;
        }
    };
}

Validator.isConfirmed = function(selector, getConfirmValue,message) {
    return {
        selector: selector,
        test: function (value){
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác';
        }
    };
}