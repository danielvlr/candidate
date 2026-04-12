package com.empresa.sistema.client.chatgpt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LinkedInProfileResponse {

    private String profileUrl;
    private String profileImageUrl;
    private String name;
    private String headline;
    private String location;
    private ContactInfo contact;
    private String about;
    private List<ExperienceInfo> experience;
    private List<EducationInfo> education;
    private List<String> skills;
    private List<String> certifications;
    private List<String> languages;
    private List<String> projects;
    private List<String> volunteer;

    public LinkedInProfileResponse() {}

    public String getProfileUrl() { return profileUrl; }
    public void setProfileUrl(String profileUrl) { this.profileUrl = profileUrl; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public ContactInfo getContact() { return contact; }
    public void setContact(ContactInfo contact) { this.contact = contact; }

    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }

    public List<ExperienceInfo> getExperience() { return experience; }
    public void setExperience(List<ExperienceInfo> experience) { this.experience = experience; }

    public List<EducationInfo> getEducation() { return education; }
    public void setEducation(List<EducationInfo> education) { this.education = education; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<String> getCertifications() { return certifications; }
    public void setCertifications(List<String> certifications) { this.certifications = certifications; }

    public List<String> getLanguages() { return languages; }
    public void setLanguages(List<String> languages) { this.languages = languages; }

    public List<String> getProjects() { return projects; }
    public void setProjects(List<String> projects) { this.projects = projects; }

    public List<String> getVolunteer() { return volunteer; }
    public void setVolunteer(List<String> volunteer) { this.volunteer = volunteer; }

    public static class ContactInfo {
        private String email;
        private String phone;
        private String website;
        private String linkedinProfile;

        public ContactInfo() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getWebsite() { return website; }
        public void setWebsite(String website) { this.website = website; }

        public String getLinkedinProfile() { return linkedinProfile; }
        public void setLinkedinProfile(String linkedinProfile) { this.linkedinProfile = linkedinProfile; }
    }

    public static class ExperienceInfo {
        private String title;
        private String company;
        private String startDate;
        private String endDate;
        private String location;
        private String description;

        public ExperienceInfo() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCompany() { return company; }
        public void setCompany(String company) { this.company = company; }

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }

        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class EducationInfo {
        private String school;
        private String degree;
        private String startDate;
        private String endDate;
        private String description;

        public EducationInfo() {}

        public String getSchool() { return school; }
        public void setSchool(String school) { this.school = school; }

        public String getDegree() { return degree; }
        public void setDegree(String degree) { this.degree = degree; }

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }

        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}