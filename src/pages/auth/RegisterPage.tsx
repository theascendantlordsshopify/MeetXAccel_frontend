@@ .. @@
 import { z } from 'zod';
 import { useMutation } from '@tanstack/react-query';
 import { UserPlusIcon } from '@heroicons/react/24/outline';
 import { Card } from '../../components/ui/Card';
 import { Button } from '../../components/ui/Button';
 import { Input } from '../../components/ui/Input';
 import { authApi } from '../../services/api';
 import { useAuthStore } from '../../stores/authStore';
 
 const schema = z.object({
+  first_name: z.string().min(1, 'First name is required'),
+  last_name: z.string().optional(),
+  username: z.string().optional(),
   email: z.string().email('Please enter a valid email address'),
   password: z.string().min(8, 'Password must be at least 8 characters'),
   password_confirm: z.string(),
+  terms_accepted: z.boolean().refine(val => val === true, {
+    message: 'You must accept the terms and conditions',
+  }),
 }).refine((data) => data.password === data.password_confirm, {
   message: "Passwords don't match",
   path: ["password_confirm"],
 });
 
 type FormData = z.infer<typeof schema>;
 
 export const RegisterPage: React.FC = () => {
   const navigate = useNavigate();
   const { login } = useAuthStore();
   
   const form = useForm<FormData>({
     resolver: zodResolver(schema),
+    defaultValues: {
+      terms_accepted: false,
+    },
   });
 
   const mutation = useMutation({
     mutationFn: authApi.register,
     onSuccess: (response) => {
       login(response.data.user, response.data.token);
       toast.success(response.data.message || 'Registration successful!');
       navigate('/dashboard');
     },
     onError: (error: any) => {
       const message = error.response?.data?.error || 'Registration failed';
       toast.error(message);
       
       // Handle field-specific errors
       if (error.response?.data?.errors) {
         Object.entries(error.response.data.errors).forEach(([field, messages]) => {
           if (Array.isArray(messages) && messages.length > 0) {
             form.setError(field as keyof FormData, {
               message: messages[0],
             });
           }
         });
       }
     },
   });
 
   const onSubmit = (data: FormData) => {
     mutation.mutate(data);
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
       <div className="max-w-md w-full space-y-8">
         <div className="text-center">
           <div className="w-16 h-16 bg-monkai-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <UserPlusIcon className="h-8 w-8 text-monkai-600" />
           </div>
           
           <h2 className="text-3xl font-display font-bold text-neutral-900">
             Create your account
           </h2>
           
           <p className="mt-2 text-neutral-600">
             Join thousands of professionals who trust our scheduling platform
           </p>
         </div>
 
         <Card className="p-8">
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
+            <div className="grid grid-cols-2 gap-4">
+              <Input
+                label="First Name"
+                required
+                {...form.register('first_name')}
+                error={form.formState.errors.first_name?.message}
+                placeholder="John"
+              />
+              
+              <Input
+                label="Last Name"
+                {...form.register('last_name')}
+                error={form.formState.errors.last_name?.message}
+                placeholder="Doe"
+              />
+            </div>
+
+            <Input
+              label="Username (Optional)"
+              {...form.register('username')}
+              error={form.formState.errors.username?.message}
+              placeholder="johndoe"
+              help="Leave blank to use your email as username"
+            />
+
             <Input
               label="Email Address"
               type="email"
               required
               {...form.register('email')}
               error={form.formState.errors.email?.message}
+              placeholder="john@example.com"
             />
 
             <Input
               label="Password"
               type="password"
               required
               {...form.register('password')}
               error={form.formState.errors.password?.message}
               help="Must be at least 8 characters with uppercase, lowercase, number, and special character"
             />
 
             <Input
               label="Confirm Password"
               type="password"
               required
               {...form.register('password_confirm')}
               error={form.formState.errors.password_confirm?.message}
             />
 
+            <div className="flex items-start">
+              <div className="flex items-center h-5">
+                <input
+                  id="terms_accepted"
+                  type="checkbox"
+                  {...form.register('terms_accepted')}
+                  className="h-4 w-4 text-monkai-600 focus:ring-monkai-500 border-neutral-300 rounded"
+                />
+              </div>
+              <div className="ml-3 text-sm">
+                <label htmlFor="terms_accepted" className="text-neutral-700">
+                  I agree to the{' '}
+                  <a href="/terms" target="_blank" className="text-monkai-600 hover:text-monkai-700 underline">
+                    Terms and Conditions
+                  </a>{' '}
+                  and{' '}
+                  <a href="/privacy" target="_blank" className="text-monkai-600 hover:text-monkai-700 underline">
+                    Privacy Policy
+                  </a>
+                </label>
+                {form.formState.errors.terms_accepted && (
+                  <p className="mt-1 text-sm text-danger-600">
+                    {form.formState.errors.terms_accepted.message}
+                  </p>
+                )}
+              </div>
+            </div>
+
             <Button
               type="submit"
               variant="primary"
               className="w-full"
               loading={mutation.isPending}
             >
               Create Account
             </Button>
           </form>
 
           <div className="mt-6 text-center">
             <p className="text-sm text-neutral-600">
               Already have an account?{' '}
               <Link to="/login" className="text-monkai-600 hover:text-monkai-700 font-medium">
                 Sign in
               </Link>
             </p>
           </div>
         </Card>
       </div>
     </div>
   );
 };