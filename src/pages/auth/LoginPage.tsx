@@ .. @@
 import { z } from 'zod';
 import { useMutation } from '@tanstack/react-query';
 import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
 import { Card } from '../../components/ui/Card';
 import { Button } from '../../components/ui/Button';
 import { Input } from '../../components/ui/Input';
 import { authApi } from '../../services/api';
 import { useAuthStore } from '../../stores/authStore';
 
 const schema = z.object({
   email: z.string().email('Please enter a valid email address'),
   password: z.string().min(1, 'Password is required'),
+  remember_me: z.boolean().optional(),
 });
 
 type FormData = z.infer<typeof schema>;
 
 export const LoginPage: React.FC = () => {
   const navigate = useNavigate();
   const { login } = useAuthStore();
   
   const form = useForm<FormData>({
     resolver: zodResolver(schema),
+    defaultValues: {
+      remember_me: false,
+    },
   });
 
   const mutation = useMutation({
     mutationFn: authApi.login,
     onSuccess: (response) => {
       login(response.user, response.token);
       toast.success('Welcome back!');
       navigate('/dashboard');
     },
     onError: (error: any) => {
+      // Handle password expired specifically
+      if (error.response?.data?.code === 'password_expired') {
+        toast.error('Your password has expired. Please set a new password.');
+        navigate('/force-password-change');
+        return;
+      }
+      
       const message = error.response?.data?.error || 'Login failed';
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
             <LockClosedIcon className="h-8 w-8 text-monkai-600" />
           </div>
           
           <h2 className="text-3xl font-display font-bold text-neutral-900">
             Sign in to your account
           </h2>
           
           <p className="mt-2 text-neutral-600">
             Welcome back! Please enter your details.
           </p>
         </div>
 
         <Card className="p-8">
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <Input
               label="Email Address"
               type="email"
               required
               icon={<EnvelopeIcon className="h-5 w-5" />}
               {...form.register('email')}
               error={form.formState.errors.email?.message}
+              placeholder="john@example.com"
             />
 
             <Input
               label="Password"
               type="password"
               required
               icon={<LockClosedIcon className="h-5 w-5" />}
               {...form.register('password')}
               error={form.formState.errors.password?.message}
             />
 
+            <div className="flex items-center justify-between">
+              <div className="flex items-center">
+                <input
+                  id="remember_me"
+                  type="checkbox"
+                  {...form.register('remember_me')}
+                  className="h-4 w-4 text-monkai-600 focus:ring-monkai-500 border-neutral-300 rounded"
+                />
+                <label htmlFor="remember_me" className="ml-2 block text-sm text-neutral-700">
+                  Remember me for 30 days
+                </label>
+              </div>
+
+              <div className="text-sm">
+                <Link
+                  to="/forgot-password"
+                  className="text-monkai-600 hover:text-monkai-700 font-medium"
+                >
+                  Forgot password?
+                </Link>
+              </div>
+            </div>
+
             <Button
               type="submit"
               variant="primary"
               className="w-full"
               loading={mutation.isPending}
             >
               Sign In
             </Button>
           </form>
 
-          <div className="mt-6 text-center">
-            <Link
-              to="/forgot-password"
-              className="text-sm text-monkai-600 hover:text-monkai-700 font-medium"
-            >
-              Forgot your password?
-            </Link>
-          </div>
-
           <div className="mt-6 text-center">
             <p className="text-sm text-neutral-600">
               Don't have an account?{' '}
               <Link to="/register" className="text-monkai-600 hover:text-monkai-700 font-medium">
                 Sign up
               </Link>
             </p>
           </div>
         </Card>
       </div>
     </div>
   );
 };