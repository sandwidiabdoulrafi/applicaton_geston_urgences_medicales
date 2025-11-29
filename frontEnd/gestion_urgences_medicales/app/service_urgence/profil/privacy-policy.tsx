
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Politique de Confidentialiter",
                    headerStyle: { backgroundColor: '#58D68D' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' },
                }}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <Ionicons name="shield-checkmark" size={64} color="#0066CC" />
                    <Text style={styles.heroTitle}>Politique de confidentialité</Text>
                    <Text style={styles.heroSubtitle}>
                        Dernière mise à jour : 25 novembre 2025
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Collecte des données</Text>
                    <Text style={styles.paragraph}>
                        Nous collectons les informations que vous nous fournissez directement lors de la création de votre compte et de l'utilisation de nos services :
                    </Text>
                    <View style={styles.bulletList}>
                        <BulletPoint text="Informations de l'établissement (nom, type, adresse)" />
                        <BulletPoint text="Coordonnées de contact (téléphone, email)" />
                        <BulletPoint text="Données de localisation géographique" />
                        <BulletPoint text="Informations sur les urgences médicales traitées" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Utilisation des données</Text>
                    <Text style={styles.paragraph}>
                        Nous utilisons vos données pour :
                    </Text>
                    <View style={styles.bulletList}>
                        <BulletPoint text="Fournir et améliorer nos services d'urgence médicale" />
                        <BulletPoint text="Communiquer avec vous concernant les urgences" />
                        <BulletPoint text="Assurer la sécurité et la fiabilité de notre plateforme" />
                        <BulletPoint text="Respecter nos obligations légales" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Partage des données</Text>
                    <Text style={styles.paragraph}>
                        Vos données peuvent être partagées avec :
                    </Text>
                    <View style={styles.bulletList}>
                        <BulletPoint text="Les patients et assistants médicaux dans le cadre des urgences" />
                        <BulletPoint text="Les autorités sanitaires si requis par la loi" />
                        <BulletPoint text="Nos prestataires de services techniques" />
                    </View>
                    <Text style={styles.paragraph}>
                        Nous ne vendons jamais vos données personnelles à des tiers.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Sécurité des données</Text>
                    <Text style={styles.paragraph}>
                        Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Vos droits</Text>
                    <Text style={styles.paragraph}>
                        Vous avez le droit de :
                    </Text>
                    <View style={styles.bulletList}>
                        <BulletPoint text="Accéder à vos données personnelles" />
                        <BulletPoint text="Corriger vos données inexactes" />
                        <BulletPoint text="Demander la suppression de vos données" />
                        <BulletPoint text="Vous opposer au traitement de vos données" />
                        <BulletPoint text="Retirer votre consentement à tout moment" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Conservation des données</Text>
                    <Text style={styles.paragraph}>
                        Nous conservons vos données aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Les données médicales sont conservées conformément à la réglementation du Burkina Faso.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Contact</Text>
                    <Text style={styles.paragraph}>
                        Pour toute question concernant cette politique de confidentialité, contactez-nous :
                    </Text>
                    <View style={styles.contactCard}>
                        <ContactItem icon="mail" text="privacy@urgencesante.bf" />
                        <ContactItem icon="call" text="+226 25 00 00 00" />
                        <ContactItem icon="location" text="Ouagadougou, Burkina Faso" />
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}


const BulletPoint: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.bulletItem}>
        <View style={styles.bullet} />
        <Text style={styles.bulletText}>{text}</Text>
    </View>
);

const ContactItem: React.FC<{ icon: any; text: string }> = ({ icon, text }) => (
    <View style={styles.contactItem}>
        <Ionicons name={icon} size={20} color="#0066CC" />
        <Text style={styles.contactText}>{text}</Text>
    </View>
);




// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 12,
    },
    bulletList: {
        marginTop: 8,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0066CC',
        marginTop: 8,
        marginRight: 12,
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    contactCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    contactText: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '500',
    },
    acceptSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#D1FAE5',
        padding: 16,
        marginHorizontal: 20,
        borderRadius: 12,
        marginTop: 8,
    },
    acceptText: {
        flex: 1,
        fontSize: 14,
        color: '#065F46',
        lineHeight: 20,
    },
    quickContactSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    quickContactGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    quickContactCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    quickContactTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 8,
    },
    quickContactSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    faqSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    faqItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 12,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 22,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    guidesSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    guideCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    guideIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    guideContent: {
        flex: 1,
    },
    guideTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    guideSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    bottomSpacer: {
        height: 40,
    },
});