package com.roomify.backend.security;

import com.roomify.backend.entity.Role;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Authorized {
    Role[] roles() default {};

    boolean requireSameDepartment() default false;
}
