export interface JobOffer {
    id: number;
    platform: string;
    type?: string;
    registration_done: boolean;
    registration_date?: string;
    profile_link?: string;
    offer_title: string;
    offer_link?: string;
    save_date?: string;
    application_sent: boolean;
    application_date?: string;
    status: string;
}

export interface Recruiter {
    id: number;
    name: string;
    company: string;
    linkedin_profile?: string;
    sector?: string;
    connection_request_sent: boolean;
    request_date?: string;
    connection_status: string;
    dm_sent: boolean;
    dm_date?: string;
    message_type?: string;
    response_received: boolean;
    notes?: string;
}

export interface LinkedInActivity {
    id: number;
    activity_date: string;
    activity_type: string;
    description: string;
    link?: string;
}

export interface Application {
    id: number;
    company: string;
    position: string;
    company_link?: string;
    offer_link?: string;
    recruiter_name?: string;
    dm_sent_date?: string;
    follow_up_5_date?: string;
    follow_up_15_date?: string;
    follow_up_30_date?: string;
    final_status: string;
    notes?: string;
}
