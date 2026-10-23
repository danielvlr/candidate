package com.empresa.sistema.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Liga beans da integração Jestor só quando há token de fato.
 * {@code @ConditionalOnProperty} sem havingValue aceita valor vazio, o que ligaria a sync sem credencial.
 */
public class JestorTokenConfiguredCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        return StringUtils.hasText(context.getEnvironment().getProperty("jestor.api-token"));
    }
}
