package com.empresa.sistema.util;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.empresa.sistema.api.dto.CandidatoDTO;
import com.empresa.sistema.model.db.Candidato;
import org.modelmapper.Converter;
import org.modelmapper.ModelMapper;
import org.modelmapper.spi.MappingContext;
import org.springframework.data.domain.Page;

public class MapUtil {
	public static <S, T> T mapObject(S source, Class<T> targetClass) {
		ModelMapper modelMapper = new ModelMapper();
		return modelMapper.map(source, targetClass);
	}
	
	public static <S, T> List<T> mapList(List<S> source, Class<T> targetClass) {
		ModelMapper modelMapper = new ModelMapper();
	    return source
	      .stream()
	      .map(element -> modelMapper.map(element, targetClass))
	      .collect(Collectors.toList());
	}

	public static <S, T> Set<T> mapSet(Set<S> source, Class<T> targetClass) {
		ModelMapper modelMapper = new ModelMapper();
	    return source
	      .stream()
	      .map(element -> modelMapper.map(element, targetClass))
	      .collect(Collectors.toSet());
	}

    public static <S, T>Page<T> mapPage(Page<S> page, Class<T> targetClass) {
		return page.map(c->mapObject(c, targetClass));
	}

}
