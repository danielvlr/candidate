package com.empresa.sistema.api.dto;

import java.util.HashSet;
import java.util.Set;

import lombok.Setter;

@Setter
public class PatchRequest <T>{
	Set<T> inserts;
	Set<T> deletes;
	Set<T> updates;

	public Set<T> getInserts() {
		return inserts!=null?inserts:new HashSet<T>();
	}
	public Set<T> getDeletes() {
		return deletes!=null?deletes:new HashSet<T>();
	}
	public Set<T> getUpdates() {
		return updates!=null?updates:new HashSet<T>();
	}	
}
