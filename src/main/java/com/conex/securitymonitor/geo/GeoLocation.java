package com.conex.securitymonitor.geo;

public class GeoLocation {

    public static final String UNKNOWN = "UNKNOWN";
    public static final GeoLocation UNKNOWN_LOCATION = new GeoLocation(UNKNOWN, UNKNOWN);

    private final String country;
    private final String city;

    public GeoLocation(String country, String city) {
        this.country = country;
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public String getCity() {
        return city;
    }
}
